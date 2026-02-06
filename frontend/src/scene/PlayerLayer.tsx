import { useStore } from '../store'
import { PlayerTotem } from './PlayerTotem'
import { Ball } from './Ball'
import { DragPlane } from './DragPlane'
import type { PlayData, BallPhase } from '../types'

// Soccer simplified events
const AIRBORNE_EVENTS = new Set(['pass', 'shot', 'cross'])
const GROUNDED_EVENTS = new Set([
  'received', 'tackle', 'goal', 'out', 'dribble'
])

function getBallPhase(play: PlayData, frameIndex: number): BallPhase {
  if (!play.events) return 'held' // Default to on-ground/dribbling for soccer
  const maxIdx = Math.min(frameIndex, play.frames.length - 1)

  // Backward scan for last state change
  for (let i = maxIdx; i >= 0; i--) {
    const event = play.events[String(play.frames[i].id)]
    if (!event) continue
    if (AIRBORNE_EVENTS.has(event)) return 'airborne'
    if (GROUNDED_EVENTS.has(event)) return 'held'
  }
  return 'held'
}

function getAirborneProgress(play: PlayData, frameIndex: number): number {
  if (!play.events) return 0
  let passStart = -1
  let passEnd = -1
  // Find the pass_forward at or before current frame
  for (let i = frameIndex; i >= 0; i--) {
    const event = play.events[String(play.frames[i].id)]
    if (event === 'pass_forward') { passStart = i; break }
    if (event && GROUNDED_EVENTS.has(event)) return 0
  }
  if (passStart < 0) return 0
  // Find the pass_arrived/outcome after pass_forward
  for (let i = passStart + 1; i < play.frames.length; i++) {
    const event = play.events[String(play.frames[i].id)]
    if (event && GROUNDED_EVENTS.has(event)) { passEnd = i; break }
  }
  if (passEnd < 0) passEnd = Math.min(passStart + 20, play.frames.length - 1)
  const duration = passEnd - passStart
  if (duration <= 0) return 0
  return Math.max(0, Math.min(1, (frameIndex - passStart) / duration))
}

/** Scan backwards to find position for a player.
 *  For sparse data (e.g. Gemini/mock): extrapolate from last known position + velocity
 *  so players don't freeze in place. */
function getPlayerPosition(play: PlayData, frameIndex: number, id: string): [number, number] | undefined {
  const clampedIndex = Math.min(frameIndex, play.frames.length - 1)
  if (clampedIndex < 0) return undefined

  // Check current frame first
  const currentPos = play.frames[clampedIndex]?.positions[id]
  if (currentPos) return currentPos

  // Scan backwards to find the last known position
  for (let i = clampedIndex - 1; i >= 0; i--) {
    const pos = play.frames[i].positions[id]
    if (pos) {
      // Extrapolate using velocity if available
      const vel = play.frames[i].velocities[id]
      const dt = (clampedIndex - i) * 0.1 // frames are 10Hz
      if (vel && (vel[0] !== 0 || vel[1] !== 0)) {
        // Damped extrapolation — velocity decays over time
        const damping = Math.exp(-1.5 * dt)
        return [
          pos[0] + vel[0] * dt * damping,
          pos[1] + vel[1] * dt * damping,
        ]
      }
      return pos
    }
  }
  return undefined
}

export function PlayerLayer() {
  const currentPlay = useStore((s) => s.currentPlay)
  const currentFrame = useStore((s) => s.currentFrame)
  const predictedPlay = useStore((s) => s.predictedPlay)
  const predictionFrame = useStore((s) => s.predictionFrame)
  const selectedPlayer = useStore((s) => s.selectedPlayer)
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer)
  const cameraMode = useStore((s) => s.cameraMode)
  const playing = useStore((s) => s.playing)
  const dragOverrides = useStore((s) => s.dragOverrides)

  const activePlay = predictedPlay || currentPlay
  const activeFrame = predictedPlay ? predictionFrame : currentFrame

  if (!currentPlay || !activePlay?.frames[activeFrame]) return null

  const playerEntries = Object.entries(currentPlay.players).filter(
    ([id]) => id !== 'ball',
  )

  const ballOverride = !predictedPlay ? dragOverrides['ball'] : undefined
  const ballPos = ballOverride || getPlayerPosition(activePlay, activeFrame, 'ball')
  const ballNextPos = !ballOverride ? getPlayerPosition(activePlay, activeFrame + 1, 'ball') : undefined
  const isDraggable = !playing && !predictedPlay
  const ballPhase = predictedPlay ? 'held' as BallPhase : getBallPhase(currentPlay, currentFrame)
  const airborneProgress = predictedPlay ? 0 : getAirborneProgress(currentPlay, currentFrame)

  return (
    <group onClick={(e) => {
      if (e.object.type === 'Mesh' || e.object.type === 'Group') return
    }}>
      {playerEntries.map(([id, player]) => {
        const override = !predictedPlay ? dragOverrides[id] : undefined
        const pos = override || getPlayerPosition(activePlay, activeFrame, id)
        if (!pos) return null
        const nextPos = !override ? getPlayerPosition(activePlay, activeFrame + 1, id) : undefined
        return (
          <PlayerTotem
            key={id}
            playerId={id}
            name={player.name}
            jersey={player.jersey ?? 0}
            position={player.position ?? ''}
            team={player.team === 'home' ? 'home' : 'away'}
            targetX={pos[0]}
            targetY={pos[1]}
            nextX={nextPos?.[0]}
            nextY={nextPos?.[1]}
            selected={selectedPlayer === id}
            isEgoTarget={selectedPlayer === id && cameraMode === 'ego'}
            onSelect={() => setSelectedPlayer(id)}
            isDraggable={isDraggable}
            onDragStart={() => useStore.getState().setSelectedPlayer(id)}
          />
        )
      })}
      {ballPos && (
        <Ball
          x={ballPos[0]}
          y={ballPos[1]}
          nextX={ballNextPos?.[0]}
          nextY={ballNextPos?.[1]}
          phase={ballPhase}
          airborneProgress={airborneProgress}
          selected={selectedPlayer === 'ball'}
          onSelect={() => setSelectedPlayer('ball')}
          isDraggable={isDraggable}
        />
      )}
      <DragPlane />
    </group>
  )
}
