import type { ForwardSimulator, SimulationInput, CanonicalPlay, Frame } from '../types.js'
import { FIELD_LENGTH, FIELD_WIDTH } from '../constants.js'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

const FRICTION = 0.95
const DT = 0.1 // 10 Hz
const DRIFT_STRENGTH = 0.5 // lateral acceleration magnitude (m/s²)
const NOISE_VELOCITY = 0.8  // random velocity jitter per frame (m/s)
const NOISE_FRICTION = 0.03 // per-run friction variation (±)
const BALL_OFFSET = 0.5 // ball offset from possessor (meters)
const POSSESSION_RADIUS = 2.0 // radius within which a player can possess the ball

/** Simple deterministic hash of a string → number in [0, 1) */
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0
  }
  return (Math.abs(h) % 10000) / 10000
}

/** Box-Muller transform: returns a sample from N(0, 1) */
function randn(): number {
  const u1 = Math.random()
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2)
}

/** Find the closest player to the ball from a given team */
function findClosestPlayer(
  ball: { x: number; y: number },
  current: Record<string, { x: number; y: number; vx: number; vy: number; ori: number }>,
  state: Record<string, { team: 'home' | 'away' | 'ball' }>
): string | null {
  let closestId: string | null = null
  let minDist = Infinity

  for (const [id, p] of Object.entries(current)) {
    if (id === 'ball') continue
    const teamInfo = state[id]
    if (!teamInfo || teamInfo.team === 'ball') continue

    // Prefer home team (attacking)
    const dx = p.x - ball.x
    const dy = p.y - ball.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Give priority to home team players for possession
    const effectiveDist = teamInfo.team === 'home' ? dist : dist * 1.5

    if (effectiveDist < minDist && dist < POSSESSION_RADIUS * 3) {
      minDist = effectiveDist
      closestId = id
    }
  }
  return closestId
}

export class MockForwardSimulator implements ForwardSimulator {
  async predict(input: SimulationInput): Promise<CanonicalPlay> {
    const { gameId, playId, frameId, horizon, state, players } = input

    // Build mutable copy of state
    const current: Record<string, { x: number; y: number; vx: number; vy: number; ori: number }> = {}
    for (const [id, snap] of Object.entries(state)) {
      current[id] = {
        x: snap.pos[0],
        y: snap.pos[1],
        vx: snap.vel[0],
        vy: snap.vel[1],
        ori: snap.ori,
      }
    }

    // Determine initial ball possessor
    const ball = current['ball']
    let possessorId = ball ? findClosestPlayer(ball, current, state) : null

    // Per-player drift parameters (deterministic base from player ID + random per run)
    const driftParams: Record<string, { phase: number; freq: number; frictionMul: number }> = {}
    for (const id of Object.keys(current)) {
      if (id === 'ball') continue
      const h = hashId(id)
      driftParams[id] = {
        phase: h * Math.PI * 2 + Math.random() * Math.PI,  // base + random phase jitter
        freq: 1.5 + h * 2.0 + (Math.random() - 0.5) * 1.0, // freq jitter
        frictionMul: FRICTION + (Math.random() - 0.5) * 2 * NOISE_FRICTION, // per-player friction variation
      }
    }

    const frames: Frame[] = []

    for (let i = 1; i <= horizon; i++) {
      const positions: Record<string, [number, number]> = {}
      const velocities: Record<string, [number, number]> = {}
      const orientations: Record<string, number> = {}

      // First, update all player positions
      for (const [id, p] of Object.entries(current)) {
        if (id === 'ball') continue // Handle ball separately

        const drift = driftParams[id]
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)

        // Stop players that have reached the field boundary
        const atBoundary = p.x <= 0.5 || p.x >= FIELD_LENGTH - 0.5 || p.y <= 0.5 || p.y >= FIELD_WIDTH - 0.5

        // Add lateral drift proportional to speed (so stationary players don't wander)
        if (drift && speed > 0.5 && !atBoundary) {
          const t = i * DT
          const lateralAccel = Math.sin(drift.freq * t + drift.phase) * DRIFT_STRENGTH
          // Perpendicular to velocity direction
          const nx = -p.vy / speed
          const ny = p.vx / speed
          p.vx += nx * lateralAccel * DT
          p.vy += ny * lateralAccel * DT

          // Random velocity noise (Gaussian, scaled by current speed)
          p.vx += randn() * NOISE_VELOCITY * DT
          p.vy += randn() * NOISE_VELOCITY * DT
        }

        if (atBoundary) {
          // Freeze players at the boundary
          p.vx = 0
          p.vy = 0
        }

        // Integrate position
        p.x = clamp(p.x + p.vx * DT, 0, FIELD_LENGTH)
        p.y = clamp(p.y + p.vy * DT, 0, FIELD_WIDTH)

        // Apply friction (with per-player variation)
        const fric = drift ? drift.frictionMul : FRICTION
        p.vx *= fric
        p.vy *= fric

        positions[id] = [round2(p.x), round2(p.y)]
        velocities[id] = [round2(p.vx), round2(p.vy)]
        orientations[id] = round2(p.ori)
      }

      // Now handle ball - it follows the possessor
      if (ball) {
        if (possessorId && current[possessorId]) {
          const possessor = current[possessorId]
          const possessorSpeed = Math.sqrt(possessor.vx * possessor.vx + possessor.vy * possessor.vy)

          // Ball follows possessor with small offset in direction of movement
          let offsetX = 0
          let offsetY = BALL_OFFSET
          if (possessorSpeed > 0.5) {
            // Offset in direction of movement
            offsetX = (possessor.vx / possessorSpeed) * BALL_OFFSET
            offsetY = (possessor.vy / possessorSpeed) * BALL_OFFSET
          }

          // Smoothly move ball toward possessor + offset position
          const targetX = possessor.x + offsetX
          const targetY = possessor.y + offsetY

          // Ball moves quickly to stay with possessor
          const ballSpeed = 15.0 // m/s - ball moves fast
          const dx = targetX - ball.x
          const dy = targetY - ball.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > 0.1) {
            const moveSpeed = Math.min(ballSpeed * DT, dist)
            ball.x += (dx / dist) * moveSpeed
            ball.y += (dy / dist) * moveSpeed
            ball.vx = (dx / dist) * moveSpeed / DT
            ball.vy = (dy / dist) * moveSpeed / DT
          } else {
            // Ball is close enough, match possessor velocity
            ball.x = targetX
            ball.y = targetY
            ball.vx = possessor.vx
            ball.vy = possessor.vy
          }
        } else {
          // No possessor - ball continues with friction
          ball.x = clamp(ball.x + ball.vx * DT, 0, FIELD_LENGTH)
          ball.y = clamp(ball.y + ball.vy * DT, 0, FIELD_WIDTH)
          ball.vx *= 0.9 // Higher friction for loose ball
          ball.vy *= 0.9

          // Check if any player picks up the ball
          possessorId = findClosestPlayer(ball, current, state)
        }

        ball.x = clamp(ball.x, 0, FIELD_LENGTH)
        ball.y = clamp(ball.y, 0, FIELD_WIDTH)

        positions['ball'] = [round2(ball.x), round2(ball.y)]
        velocities['ball'] = [round2(ball.vx), round2(ball.vy)]
        orientations['ball'] = 0
      }

      frames.push({ id: frameId + i, positions, velocities, orientations })
    }

    return {
      gameId,
      playId,
      frameCount: horizon,
      events: {},
      players,
      frames,
      source: 'mock',
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
