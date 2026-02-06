import { useRef, useEffect } from 'react'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useFunModeStore } from './funModeStore'

export function FunModeCamera() {
  const funPhase = useFunModeStore((s) => s.funPhase)
  const cameraPose = useFunModeStore((s) => s.funCameraPose)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  const isActive = cameraPose && (funPhase === 'revealing' || funPhase === 'interactive')

  // Point camera at target when pose changes
  useEffect(() => {
    if (!isActive || !cameraRef.current || !cameraPose) return
    cameraRef.current.lookAt(...cameraPose.target)
  }, [isActive, cameraPose])

  if (!isActive || !cameraPose) return null

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={cameraPose.position}
        fov={cameraPose.fov}
        near={0.1}
        far={500}
      />
      {funPhase === 'interactive' && (
        <OrbitControls
          target={cameraPose.target}
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={150}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={false}
        />
      )}
    </>
  )
}
