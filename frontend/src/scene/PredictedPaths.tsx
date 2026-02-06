import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { toScene } from '../utils/constants'

export function PredictedPaths() {
  const predictedPlay = useStore((s) => s.predictedPlay)
  const currentPlay = useStore((s) => s.currentPlay)

  const paths = useMemo(() => {
    if (!predictedPlay || !currentPlay) return null

    const result: Array<{ id: string; points: THREE.Vector3[]; team: string }> = []

    for (const [playerId, player] of Object.entries(predictedPlay.players)) {
      const points: THREE.Vector3[] = []
      for (const frame of predictedPlay.frames) {
        const pos = frame.positions[playerId]
        if (!pos) continue
        const [sx, , sz] = toScene(pos[0], pos[1])
        points.push(new THREE.Vector3(sx, player.team === 'ball' ? 0.5 : 0.15, sz))
      }

      // Skip if path is too short or player barely moved
      if (points.length < 2) continue
      const first = points[0]
      const last = points[points.length - 1]
      const dist = first.distanceTo(last)
      if (dist < 0.5) continue

      result.push({ id: playerId, points, team: player.team })
    }

    return result
  }, [predictedPlay, currentPlay])

  if (!paths) return null

  return (
    <group>
      {paths.map(({ id, points, team }) => (
        <Line
          key={id}
          points={points}
          color={team === 'ball' ? '#ffffff' : team === 'home' ? '#00e5ff' : '#e0e0e0'}
          lineWidth={team === 'ball' ? 3 : 2}
          dashed={team !== 'ball'}
          dashSize={0.4}
          gapSize={0.2}
          transparent
          opacity={team === 'ball' ? 0.9 : 0.6}
        />
      ))}
    </group>
  )
}
