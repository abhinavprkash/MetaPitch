import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { toScene } from '../utils/constants'

export function PosteriorPaths() {
  const beliefEngineResult = useStore((s) => s.beliefEngineResult)
  const currentPlay = useStore((s) => s.currentPlay)

  const paths = useMemo(() => {
    if (!beliefEngineResult?.posteriorTrajectories || !currentPlay) return null

    const result: Array<{
      id: string
      points: THREE.Vector3[]
      team: string
      variances: number[]
    }> = []

    for (const traj of beliefEngineResult.posteriorTrajectories) {
      const player = currentPlay.players[traj.playerId]
      if (!player || player.team === 'ball') continue

      const points: THREE.Vector3[] = []
      const variances: number[] = []

      for (let i = 0; i < traj.meanPath.length; i++) {
        const pos = traj.meanPath[i]
        const [sx, , sz] = toScene(pos[0], pos[1])
        points.push(new THREE.Vector3(sx, 0.15, sz))
        variances.push(traj.variance[i] ?? 0)
      }

      if (points.length < 2) continue
      const dist = points[0].distanceTo(points[points.length - 1])
      if (dist < 0.3) continue

      result.push({ id: traj.playerId, points, team: player.team, variances })
    }

    return result
  }, [beliefEngineResult, currentPlay])

  if (!paths) return null

  return (
    <group>
      {paths.map(({ id, points, team, variances }) => {
        const color = team === 'home' ? '#00e5ff' : '#e0e0e0'
        return (
          <group key={id}>
            {/* Mean path line */}
            <Line
              points={points}
              color={color}
              lineWidth={2}
              transparent
              opacity={0.7}
            />
            {/* Variance glow rings along the path */}
            {points.map((pt, i) => {
              const v = variances[i]
              if (v < 0.1) return null
              // Radius scales with sqrt of variance, capped
              const radius = Math.min(Math.sqrt(v) * 0.3, 2)
              const opacity = Math.min(0.15 + v * 0.02, 0.4)
              return (
                <mesh
                  key={i}
                  position={[pt.x, 0.02, pt.z]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <ringGeometry args={[radius * 0.3, radius, 16]} />
                  <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={opacity}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}
