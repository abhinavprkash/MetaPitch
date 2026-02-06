import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text, Line, Ring } from '@react-three/drei'
import * as THREE from 'three'
import { CYAN_HEX, WHITE_HEX, toScene } from '../utils/constants'
import { useStore } from '../store'
import { lerp } from '../utils/interpolation'
import { playbackAlpha } from '../utils/playbackAlpha'


interface PlayerTotemProps {
  playerId: string
  name: string
  jersey: number
  position: string
  team: 'home' | 'away'
  targetX: number
  targetY: number
  nextX?: number
  nextY?: number
  onSelect?: () => void
  selected?: boolean
  isEgoTarget?: boolean
  onDragStart?: () => void
  isDraggable?: boolean
}

export function PlayerTotem({ name, jersey, team, targetX, targetY, nextX, nextY, onSelect, selected, isEgoTarget, onDragStart, isDraggable }: PlayerTotemProps) {
  const groupRef = useRef<THREE.Group>(null)
  const targetScene = toScene(targetX, targetY)

  const color = team === 'home' ? CYAN_HEX : WHITE_HEX
  const colorStr = team === 'home' ? '#00e5ff' : '#e0e0e0'

  useFrame(() => {
    if (!groupRef.current) return

    // Compute interpolated target: blend current frame → next frame by playback alpha
    let goalX = targetScene[0]
    let goalZ = targetScene[2]

    if (nextX !== undefined && nextY !== undefined) {
      const nextScene = toScene(nextX, nextY)
      goalX = lerp(targetScene[0], nextScene[0], playbackAlpha)
      goalZ = lerp(targetScene[2], nextScene[2], playbackAlpha)
    }

    // Direct positioning (no spring) for crisp tracking
    groupRef.current.position.set(goalX, targetScene[1], goalZ)
  })

  const thetherPoints = useMemo(
    () => [new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0, 4.0, 0)] as [THREE.Vector3, THREE.Vector3],
    [],
  )

  return (
    <group
      ref={groupRef}
      position={targetScene}
      visible={!isEgoTarget}
      onClick={(e) => {
        e.stopPropagation()
        if (useStore.getState().dragging) {
          useStore.getState().setDragging(false)
          useStore.getState().setSelectedPlayer(null)
          return
        }
        onSelect?.()
        if (isDraggable && useStore.getState().cameraMode !== 'ego') {
          useStore.getState().setDragging(true)
        }
      }}
    >
      {/* Ground ring */}
      <Ring
        args={[0.35, 0.45, 24]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
      >
        <meshBasicMaterial color={selected ? 0x76ff03 : color} transparent opacity={selected ? 0.9 : 0.6} depthWrite={false} />
      </Ring>

      {/* Capsule body */}
      <mesh position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.25, 0.8, 4, 8]} />
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Laser tether */}
      <Line
        points={thetherPoints}
        color={colorStr}
        lineWidth={1}
        transparent
        opacity={0.35}
      />

      {/* Floating name card */}
      <Billboard position={[0, 2.5, 0]}>
        <Text
          fontSize={0.35}
          color={colorStr}
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf"
        >
          {`#${jersey} ${name}`}
        </Text>
      </Billboard>
    </group>
  )
}
