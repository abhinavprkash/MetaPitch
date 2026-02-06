import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { toScene, WHITE_HEX, CYAN_HEX } from '../utils/constants'
import { useStore } from '../store'
import { lerp } from '../utils/interpolation'
import { playbackAlpha } from '../utils/playbackAlpha'
import type { BallPhase } from '../types'

const TRAIL_LENGTH = 8

interface BallProps {
  x: number
  y: number
  nextX?: number
  nextY?: number
  phase: BallPhase
  airborneProgress: number
  selected?: boolean
  onSelect?: () => void
  isDraggable?: boolean
}

export function Ball({ x, y, nextX, nextY, phase, airborneProgress, selected, onSelect, isDraggable }: BallProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const trailRef = useRef<THREE.Vector3[]>([])
  const trailMeshes = useRef<THREE.Mesh[]>([])
  const target = toScene(x, y)
  const isAirborne = phase === 'airborne'

  // Parabolic arc when airborne
  target[1] = isAirborne
    ? 0.5 + Math.sin(airborneProgress * Math.PI) * 4
    : 0.5


  useFrame(() => {
    if (!meshRef.current) return

    // Sub-frame interpolation toward next frame
    let goalX = target[0]
    let goalY = target[1]
    let goalZ = target[2]
    if (nextX !== undefined && nextY !== undefined) {
      const nextScene = toScene(nextX, nextY)
      goalX = lerp(target[0], nextScene[0], playbackAlpha)
      goalZ = lerp(target[2], nextScene[2], playbackAlpha)
    }

    // Direct positioning (no spring) for crisp tracking
    meshRef.current.position.set(goalX, goalY, goalZ)

    // Update point light
    if (lightRef.current) {
      lightRef.current.position.copy(meshRef.current.position)
      lightRef.current.intensity = isAirborne ? 2 : 0
    }

    // Update trail
    if (isAirborne) {
      const pos = meshRef.current.position.clone()
      trailRef.current.push(pos)
      if (trailRef.current.length > TRAIL_LENGTH) trailRef.current.shift()
    } else {
      trailRef.current.length = 0
    }

    // Position trail meshes
    for (let i = 0; i < trailMeshes.current.length; i++) {
      const m = trailMeshes.current[i]
      if (!m) continue
      const tp = trailRef.current[i]
      if (tp) {
        m.visible = true
        m.position.copy(tp)
        const opacity = ((i + 1) / TRAIL_LENGTH) * 0.4
          ; (m.material as THREE.MeshBasicMaterial).opacity = opacity
      } else {
        m.visible = false
      }
    }
  })

  const color = isAirborne ? CYAN_HEX : WHITE_HEX

  return (
    <group>
      <mesh
        ref={meshRef}
        position={target}
        onClick={(e) => {
          e.stopPropagation()
          if (useStore.getState().dragging) {
            useStore.getState().setDragging(false)
            useStore.getState().setSelectedPlayer(null)
            return
          }
          onSelect?.()
          if (isDraggable) {
            useStore.getState().setDragging(true)
          }
        }}
      >
        <icosahedronGeometry args={[0.3, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={isAirborne ? 1.0 : 0.8} />
      </mesh>
      {selected && (
        <mesh position={target} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 24]} />
          <meshBasicMaterial color={CYAN_HEX} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      <pointLight ref={lightRef} color={0x00e5ff} intensity={0} distance={8} />
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <mesh
          key={i}
          visible={false}
          ref={(el) => { if (el) trailMeshes.current[i] = el }}
        >
          <icosahedronGeometry args={[0.15, 0]} />
          <meshBasicMaterial color={CYAN_HEX} wireframe transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}
