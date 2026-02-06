import { useMemo } from 'react'
import { Line, Text, Billboard, Ring } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { toScene, FIELD_LENGTH, FIELD_HALF_WIDTH } from '../utils/constants'

/**
 * Belief Ribbon — glowing spline along the sideline showing P(TD) over time.
 * X maps to frame index, Y maps to P(TD), positioned along the field edge.
 */
function BeliefRibbon() {
  const playStats = useStore((s) => s.playStats)
  const currentFrame = useStore((s) => s.currentFrame)

  const points = useMemo(() => {
    if (!playStats) return null
    const pts: THREE.Vector3[] = []
    const n = playStats.posteriors.length
    for (let i = 0; i < n; i++) {
      const p = playStats.posteriors[i]
      // Map frame index to x along field length, offset to sideline
      const xFrac = i / Math.max(1, n - 1)
      const fieldX = xFrac * FIELD_LENGTH
      const scene = toScene(fieldX, 0)
      // Y = P(TD) scaled up for visibility
      pts.push(new THREE.Vector3(scene[0], 0.5 + p.pTouchdown * 8, scene[2] - 4))
    }
    return pts
  }, [playStats])

  const currentMarker = useMemo(() => {
    if (!playStats || !points) return null
    // Map currentFrame to the correct posteriors index (posteriors may not align with frame indices)
    const idx = Math.min(Math.floor(currentFrame / Math.max(1, (useStore.getState().currentPlay?.frames.length ?? 1) - 1) * (points.length - 1)), points.length - 1)
    if (idx < 0) return null
    return points[idx]
  }, [playStats, points, currentFrame])

  if (!points || points.length < 2) return null

  return (
    <group>
      {/* Main ribbon line */}
      <Line
        points={points}
        color="#00e5ff"
        lineWidth={1.5}
        transparent
        opacity={0.6}
      />
      {/* Current frame marker */}
      {currentMarker && (
        <mesh position={currentMarker}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.9} />
        </mesh>
      )}
      {/* Label */}
      <Billboard position={[points[0].x - 2, 3, points[0].z]}>
        <Text fontSize={0.3} color="#00e5ff" anchorX="right" anchorY="middle">
          P(TD)
        </Text>
      </Billboard>
    </group>
  )
}

/**
 * Pivotal Moment Markers — vertical glowing columns at frames with highest belief shift.
 */
function PivotalMarkers() {
  const playStats = useStore((s) => s.playStats)
  const currentPlay = useStore((s) => s.currentPlay)
  const setFrame = useStore((s) => s.setFrame)

  const markers = useMemo(() => {
    if (!playStats || !currentPlay) return []
    if (!playStats.pivotalFrames || playStats.pivotalFrames.length === 0) return []
    return playStats.pivotalFrames.map((fid) => {
      const fi = currentPlay.frames.findIndex((f) => f.id === fid)
      if (fi < 0) return null
      const frame = currentPlay.frames[fi]
      const ballPos = frame.positions['ball']
      if (!ballPos) return null
      const x = ballPos[0]
      const y = ballPos[1]
      const delta = playStats.deltas.find((d) => d.frameId === fid)
      if (!delta || delta.klDivergence < 0.005) return null
      return { fi, x, y, kl: delta.klDivergence, deltaTd: delta.deltaPTd ?? 0 }
    }).filter(Boolean) as Array<{ fi: number; x: number; y: number; kl: number; deltaTd: number }>
  }, [playStats, currentPlay])

  return (
    <group>
      {markers.map((m, i) => {
        const scene = toScene(m.x, m.y)
        const height = Math.min(3 + m.kl * 40, 10) // taller = more pivotal, capped at 10
        const color = m.deltaTd >= 0 ? '#00e5ff' : '#ff6b35'
        return (
          <group key={i} position={[scene[0], 0, scene[2]]}>
            {/* Vertical beam */}
            <Line
              points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, height, 0)]}
              color={color}
              lineWidth={2}
              transparent
              opacity={0.4}
            />
            {/* Top label */}
            <Billboard position={[0, height + 0.5, 0]}>
              <Text fontSize={0.25} color={color} anchorX="center" anchorY="bottom">
                {`F${m.fi} ${m.deltaTd >= 0 ? '+' : ''}${(m.deltaTd * 100).toFixed(0)}%`}
              </Text>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}

/**
 * Player Attribution Rings — brighten/color player ground rings based on attribution.
 * This is rendered as additional rings overlaid on existing player totems.
 */
function AttributionRings() {
  const playStats = useStore((s) => s.playStats)
  const currentPlay = useStore((s) => s.currentPlay)
  const currentFrame = useStore((s) => s.currentFrame)

  const rings = useMemo(() => {
    if (!playStats || !currentPlay) return []
    const frame = currentPlay.frames[currentFrame]
    if (!frame) return []

    // Get attributions for nearest pivotal frame
    const frameId = frame.id
    const attrs = playStats.attributions.filter((a) => a.frameId === frameId)
    if (attrs.length === 0) {
      // Use delta for current frame to show who's contributing
      const delta = playStats.deltas.find((d) => d.frameId === frameId)
      if (!delta || delta.klDivergence < 0.005) return []
    }

    // Get player stats for this frame to show separation
    const pStats = playStats.playerStats.filter((ps) => ps.frameId === frameId)

    const result: Array<{
      id: string
      x: number
      y: number
      brightness: number
      isPositive: boolean
    }> = []

    const maxScore = Math.max(0.001, ...attrs.map((a) => a.attributionScore))

    for (const [pid, info] of Object.entries(currentPlay.players)) {
      if (pid === 'ball') continue
      const pos = frame.positions[pid]
      if (!pos) continue

      const attr = attrs.find((a) => a.playerId === pid)
      const brightness = attr ? attr.attributionScore / maxScore : 0.1
      const isPositive = attr ? attr.isPositive : true

      result.push({ id: pid, x: pos[0], y: pos[1], brightness, isPositive })
    }

    return result
  }, [playStats, currentPlay, currentFrame])

  if (rings.length === 0) return null

  return (
    <group>
      {rings.map((r) => {
        const scene = toScene(r.x, r.y)
        const color = r.isPositive ? '#00e5ff' : '#ff6b35'
        return (
          <Ring
            key={r.id}
            args={[0.5, 0.65, 24]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[scene[0], 0.03, scene[2]]}
          >
            <meshBasicMaterial
              color={color}
              transparent
              opacity={r.brightness * 0.8}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </Ring>
        )
      })}
    </group>
  )
}

/**
 * Outcome Distribution — small floating bar chart near the ball showing yard buckets.
 */
function OutcomeDisplay() {
  const playStats = useStore((s) => s.playStats)
  const currentPlay = useStore((s) => s.currentPlay)
  const currentFrame = useStore((s) => s.currentFrame)

  const data = useMemo(() => {
    if (!playStats || !currentPlay) return null
    if (currentFrame >= playStats.posteriors.length) return null
    const posterior = playStats.posteriors[currentFrame]
    if (!posterior) return null
    const frame = currentPlay.frames[currentFrame]
    const ballPos = frame?.positions['ball']
    return { posterior, ballX: ballPos?.[0] ?? 60, ballY: ballPos?.[1] ?? 26.65 }
  }, [playStats, currentPlay, currentFrame])

  if (!data) return null

  const { posterior, ballX, ballY } = data
  const scene = toScene(ballX, ballY)
  const buckets = [
    { label: 'LOSS', value: posterior.distribution.loss, color: '#ff6b35' },
    { label: '0-5', value: posterior.distribution.short, color: '#4dd0e1' },
    { label: '5-10', value: posterior.distribution.medium, color: '#00e5ff' },
    { label: '10-20', value: posterior.distribution.long, color: '#00b8d4' },
    { label: '20+', value: posterior.distribution.explosive, color: '#00e5ff' },
    { label: 'TD', value: posterior.distribution.touchdown, color: '#76ff03' },
  ]

  return (
    <group position={[scene[0], 10, scene[2]]}>
      {/* Title */}
      <Billboard position={[0, 2.2, 0]}>
        <Text fontSize={0.22} color="#00e5ff" anchorX="center">
          OUTCOME DISTRIBUTION
        </Text>
      </Billboard>
      {/* Bars */}
      {buckets.map((b, i) => {
        const barHeight = Math.max(0.05, b.value * 3)
        const xOff = (i - 2.5) * 0.5
        return (
          <group key={b.label} position={[xOff, 0, 0]}>
            <mesh position={[0, barHeight / 2, 0]}>
              <boxGeometry args={[0.35, barHeight, 0.05]} />
              <meshBasicMaterial
                color={b.color}
                transparent
                opacity={0.3 + b.value * 0.7}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <Billboard position={[0, -0.3, 0]}>
              <Text fontSize={0.12} color="#e0e0e0" anchorX="center">
                {b.label}
              </Text>
            </Billboard>
            <Billboard position={[0, barHeight + 0.2, 0]}>
              <Text fontSize={0.13} color={b.color} anchorX="center">
                {(b.value * 100).toFixed(0)}%
              </Text>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}

/**
 * Selected Player Card — expanded stats when a player totem is clicked.
 */
function SelectedPlayerCard() {
  const playStats = useStore((s) => s.playStats)
  const currentPlay = useStore((s) => s.currentPlay)
  const currentFrame = useStore((s) => s.currentFrame)
  const selectedPlayer = useStore((s) => s.selectedPlayer)

  const data = useMemo(() => {
    if (!playStats || !currentPlay || !selectedPlayer) return null
    const frame = currentPlay.frames[currentFrame]
    const pos = frame?.positions[selectedPlayer]
    if (!pos) return null

    const player = currentPlay.players[selectedPlayer]
    const pStat = playStats.playerStats.find(
      (ps) => ps.playerId === selectedPlayer && ps.frameId === frame.id,
    )
    const attr = playStats.attributions.find(
      (a) => a.playerId === selectedPlayer,
    )

    return { player, pos, separation: pStat?.separation, attribution: attr?.attributionScore }
  }, [playStats, currentPlay, currentFrame, selectedPlayer])

  if (!data) return null

  const scene = toScene(data.pos[0], data.pos[1])

  return (
    <Billboard position={[scene[0] + 1.5, 6.5, scene[2]]}>
      <Text fontSize={0.25} color="#00e5ff" anchorX="left" anchorY="top">
        {`${data.player?.name ?? 'UNKNOWN'} #${data.player?.jersey ?? '?'}`}
      </Text>
      <Text fontSize={0.18} color="#e0e0e0" anchorX="left" anchorY="top" position={[0, -0.4, 0]}>
        {[
          data.player?.position ? `POS: ${data.player.position}` : '',
          data.separation != null ? `SEP: ${data.separation.toFixed(1)} yd` : '',
          data.attribution != null ? `IMPACT: ${(data.attribution * 100).toFixed(1)}` : '',
        ]
          .filter(Boolean)
          .join('\n')}
      </Text>
    </Billboard>
  )
}

/**
 * Main stats overlay — renders all sub-components when statsOverlay is toggled on.
 */
export function StatsOverlay() {
  const statsOverlay = useStore((s) => s.statsOverlay)

  if (!statsOverlay) return null

  return (
    <group>
      <BeliefRibbon />
      <AttributionRings />
      <OutcomeDisplay />
      <SelectedPlayerCard />
    </group>
  )
}
