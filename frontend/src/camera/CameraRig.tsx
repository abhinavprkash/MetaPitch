import { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { useFunModeStore } from '../funmode/funModeStore'
import {
  PERSPECTIVE_POSITION,
  AUTO_ROTATE_SPEED,
  IDLE_TIMEOUT_MS,
  FIELD_HALF_LENGTH,
  toScene,
} from '../utils/constants'
import { lerp } from '../utils/interpolation'

// Transition speed — higher = faster convergence
const TRANSITION_SPEED = 4

// Top-down camera height (perspective emulating ortho)
const TOP_HEIGHT = 100
const TOP_FOV = 30

export function CameraRig() {
  const cameraMode = useStore((s) => s.cameraMode)
  const funPhase = useFunModeStore((s) => s.funPhase)
  const funCameraPose = useFunModeStore((s) => s.funCameraPose)
  const funModeActive = funCameraPose && (funPhase === 'revealing' || funPhase === 'interactive')
  const controlsRef = useRef<any>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const idleTimerRef = useRef<number | null>(null)
  const autoRotatingRef = useRef(true)
  const lookRef = useRef(new THREE.Vector3(0, 0, 0))
  const transitioningRef = useRef(false)
  const prevModeRef = useRef(cameraMode)
  const { gl } = useThree()

  // Detect mode changes and start transitioning
  useEffect(() => {
    if (prevModeRef.current !== cameraMode) {
      transitioningRef.current = true
      prevModeRef.current = cameraMode

      // Disable orbit controls during transition
      if (controlsRef.current) {
        controlsRef.current.enabled = false
        controlsRef.current.autoRotate = false
      }
    }
  }, [cameraMode])

  const resetIdleTimer = useCallback(() => {
    if (cameraMode !== '3d') return
    autoRotatingRef.current = false
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false
    }
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = window.setTimeout(() => {
      autoRotatingRef.current = true
      if (controlsRef.current) {
        controlsRef.current.autoRotate = true
      }
    }, IDLE_TIMEOUT_MS)
  }, [cameraMode])

  useEffect(() => {
    const canvas = gl.domElement
    const handler = () => resetIdleTimer()
    canvas.addEventListener('pointerdown', handler)
    canvas.addEventListener('wheel', handler)
    return () => {
      canvas.removeEventListener('pointerdown', handler)
      canvas.removeEventListener('wheel', handler)
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    }
  }, [gl, resetIdleTimer])

  // Disable OrbitControls when fun mode camera takes over
  useEffect(() => {
    if (funModeActive && controlsRef.current) {
      controlsRef.current.enabled = false
      controlsRef.current.autoRotate = false
    }
  }, [funModeActive])

  useFrame((_, delta) => {
    const cam = cameraRef.current
    if (!cam) return

    // Don't drive camera when fun mode is active
    if (funModeActive) {
      if (controlsRef.current) {
        controlsRef.current.enabled = false
        controlsRef.current.autoRotate = false
      }
      return
    }

    const factor = 1 - Math.exp(-TRANSITION_SPEED * delta)

    // Compute target position / lookAt / fov based on mode
    let targetPos: [number, number, number]
    let targetLook: [number, number, number]
    let targetFov: number

    if (cameraMode === 'ego') {
      const { selectedPlayer, currentPlay, currentFrame } = useStore.getState()
      if (selectedPlayer && currentPlay) {
        const frame = currentPlay.frames[currentFrame]
        const pos = frame?.positions[selectedPlayer]
        const ori = frame?.orientations[selectedPlayer] ?? 0
        if (pos) {
          const [sx, , sz] = toScene(pos[0], pos[1])
          const eyeHeight = 1.8
          targetPos = [sx, eyeHeight, sz]
          const rad = (ori * Math.PI) / 180
          targetLook = [sx + Math.cos(rad) * 10, eyeHeight, sz - Math.sin(rad) * 10]
          targetFov = 90
        } else {
          return
        }
      } else {
        return
      }
    } else if (cameraMode === 'top') {
      targetPos = [0, TOP_HEIGHT, 0.01] // slight z offset to avoid gimbal lock
      targetLook = [0, 0, 0]
      targetFov = TOP_FOV
    } else {
      // 3d mode — if not transitioning, let OrbitControls drive
      if (!transitioningRef.current) {
        if (controlsRef.current) {
          controlsRef.current.enabled = true
          if (autoRotatingRef.current) {
            controlsRef.current.autoRotate = true
          }
        }
        return
      }
      targetPos = [...PERSPECTIVE_POSITION]
      targetLook = [0, 0, 0]
      targetFov = 50
    }

    // Lerp position
    cam.position.x = lerp(cam.position.x, targetPos[0], factor)
    cam.position.y = lerp(cam.position.y, targetPos[1], factor)
    cam.position.z = lerp(cam.position.z, targetPos[2], factor)

    // Lerp look-at
    lookRef.current.x = lerp(lookRef.current.x, targetLook[0], factor)
    lookRef.current.y = lerp(lookRef.current.y, targetLook[1], factor)
    lookRef.current.z = lerp(lookRef.current.z, targetLook[2], factor)
    cam.lookAt(lookRef.current)

    // Lerp FOV
    if (Math.abs(cam.fov - targetFov) > 0.1) {
      cam.fov = lerp(cam.fov, targetFov, factor)
      cam.updateProjectionMatrix()
    }

    // Check if transition is done
    const dx = cam.position.x - targetPos[0]
    const dy = cam.position.y - targetPos[1]
    const dz = cam.position.z - targetPos[2]
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (dist < 0.1 && transitioningRef.current) {
      transitioningRef.current = false
      // Re-enable orbit controls for 3d mode
      if (cameraMode === '3d' && controlsRef.current) {
        // Sync OrbitControls target to where we lerped
        controlsRef.current.target.copy(lookRef.current)
        controlsRef.current.enabled = true
        controlsRef.current.autoRotate = true
        autoRotatingRef.current = true
        controlsRef.current.update()
      }
    }

    // Sync OrbitControls target during transition to 3d so it doesn't snap
    if (cameraMode === '3d' && transitioningRef.current && controlsRef.current) {
      controlsRef.current.target.copy(lookRef.current)
      controlsRef.current.update()
    }
  })

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={PERSPECTIVE_POSITION}
        fov={50}
        near={0.1}
        far={500}
      />
      <OrbitControls
        ref={controlsRef}
        target={[0, 0, 0]}
        autoRotate={!funModeActive}
        autoRotateSpeed={AUTO_ROTATE_SPEED}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2.1}
        enableRotate={cameraMode === '3d' && !funModeActive}
        enabled={cameraMode === '3d' && !funModeActive}
      />
    </>
  )
}
