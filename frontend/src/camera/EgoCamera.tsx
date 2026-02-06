import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { toScene } from '../utils/constants'
import { lerp } from '../utils/interpolation'

export function EgoCamera() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const lookRef = useRef(new THREE.Vector3(0, 1.8, 0))

  useFrame((_, delta) => {
    const cam = cameraRef.current
    if (!cam) return

    const { selectedPlayer, currentPlay, currentFrame } = useStore.getState()
    if (!selectedPlayer || !currentPlay) return

    const frame = currentPlay.frames[currentFrame]
    if (!frame) return

    const pos = frame.positions[selectedPlayer]
    const ori = frame.orientations[selectedPlayer] ?? 0
    if (!pos) return

    const [sx, , sz] = toScene(pos[0], pos[1])
    const eyeHeight = 1.8

    // Lerp position (framerate-independent)
    const posFactor = 1 - Math.exp(-6 * delta)
    cam.position.x = lerp(cam.position.x, sx, posFactor)
    cam.position.y = lerp(cam.position.y, eyeHeight, posFactor)
    cam.position.z = lerp(cam.position.z, sz, posFactor)

    // Orientation: NFL 0°=east(+x), 90°=north(-z in scene)
    const rad = (ori * Math.PI) / 180
    const lookX = sx + Math.cos(rad) * 10
    const lookZ = sz - Math.sin(rad) * 10

    const lookFactor = 1 - Math.exp(-6 * delta)
    lookRef.current.x = lerp(lookRef.current.x, lookX, lookFactor)
    lookRef.current.y = eyeHeight
    lookRef.current.z = lerp(lookRef.current.z, lookZ, lookFactor)

    cam.lookAt(lookRef.current)
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={90}
      near={0.1}
      far={500}
      position={[0, 1.8, 0]}
    />
  )
}
