import { useMemo } from 'react'
import * as THREE from 'three'

// FIFA Standard Dimensions (Meters)
const PITCH_LENGTH = 105
const PITCH_WIDTH = 68
const LINE_WIDTH = 0.12
const CENTER_CIRCLE_RADIUS = 9.15
const PENALTY_AREA_LENGTH = 16.5
const PENALTY_AREA_WIDTH = 40.32
const GOAL_AREA_LENGTH = 5.5
const GOAL_AREA_WIDTH = 18.32
const PENALTY_SPOT_DIST = 11

const HALF_LENGTH = PITCH_LENGTH / 2
const HALF_WIDTH = PITCH_WIDTH / 2

function PitchLines() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []

    // Helper to add line segment
    const addLine = (x1: number, z1: number, x2: number, z2: number) => {
      pts.push(new THREE.Vector3(x1, 0.02, z1))
      pts.push(new THREE.Vector3(x2, 0.02, z2))
    }

    // Helper to add rectangle
    const addRect = (x: number, z: number, w: number, h: number) => {
      // Top
      addLine(x - w / 2, z - h / 2, x + w / 2, z - h / 2)
      // Bottom
      addLine(x - w / 2, z + h / 2, x + w / 2, z + h / 2)
      // Left
      addLine(x - w / 2, z - h / 2, x - w / 2, z + h / 2)
      // Right
      addLine(x + w / 2, z - h / 2, x + w / 2, z + h / 2)
    }

    // Outer Boundary (Touchlines & Goal Lines)
    addRect(0, 0, PITCH_LENGTH, PITCH_WIDTH)

    // Halfway Line
    addLine(0, -HALF_WIDTH, 0, HALF_WIDTH)

    // Penalty Areas
    // Left (Home)
    addLine(-HALF_LENGTH + PENALTY_AREA_LENGTH, -PENALTY_AREA_WIDTH / 2, -HALF_LENGTH + PENALTY_AREA_LENGTH, PENALTY_AREA_WIDTH / 2)
    addLine(-HALF_LENGTH, -PENALTY_AREA_WIDTH / 2, -HALF_LENGTH + PENALTY_AREA_LENGTH, -PENALTY_AREA_WIDTH / 2)
    addLine(-HALF_LENGTH, PENALTY_AREA_WIDTH / 2, -HALF_LENGTH + PENALTY_AREA_LENGTH, PENALTY_AREA_WIDTH / 2)

    // Right (Away)
    addLine(HALF_LENGTH - PENALTY_AREA_LENGTH, -PENALTY_AREA_WIDTH / 2, HALF_LENGTH - PENALTY_AREA_LENGTH, PENALTY_AREA_WIDTH / 2)
    addLine(HALF_LENGTH, -PENALTY_AREA_WIDTH / 2, HALF_LENGTH - PENALTY_AREA_LENGTH, -PENALTY_AREA_WIDTH / 2)
    addLine(HALF_LENGTH, PENALTY_AREA_WIDTH / 2, HALF_LENGTH - PENALTY_AREA_LENGTH, PENALTY_AREA_WIDTH / 2)

    // Goal Areas (6-yard box)
    // Left
    addLine(-HALF_LENGTH + GOAL_AREA_LENGTH, -GOAL_AREA_WIDTH / 2, -HALF_LENGTH + GOAL_AREA_LENGTH, GOAL_AREA_WIDTH / 2)
    addLine(-HALF_LENGTH, -GOAL_AREA_WIDTH / 2, -HALF_LENGTH + GOAL_AREA_LENGTH, -GOAL_AREA_WIDTH / 2)
    addLine(-HALF_LENGTH, GOAL_AREA_WIDTH / 2, -HALF_LENGTH + GOAL_AREA_LENGTH, GOAL_AREA_WIDTH / 2)

    // Right
    addLine(HALF_LENGTH - GOAL_AREA_LENGTH, -GOAL_AREA_WIDTH / 2, HALF_LENGTH - GOAL_AREA_LENGTH, GOAL_AREA_WIDTH / 2)
    addLine(HALF_LENGTH, -GOAL_AREA_WIDTH / 2, HALF_LENGTH - GOAL_AREA_LENGTH, -GOAL_AREA_WIDTH / 2)
    addLine(HALF_LENGTH, GOAL_AREA_WIDTH / 2, HALF_LENGTH - GOAL_AREA_LENGTH, GOAL_AREA_WIDTH / 2)

    return pts
  }, [])

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(v => [v.x, v.y, v.z]))}
          itemSize={3}
          args={[new Float32Array(points.flatMap(v => [v.x, v.y, v.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={0xffffff} linewidth={2} />
    </lineSegments>
  )
}

function CenterCircle() {
  return (
    <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[CENTER_CIRCLE_RADIUS - LINE_WIDTH, CENTER_CIRCLE_RADIUS, 64]} />
      <meshBasicMaterial color={0xffffff} side={THREE.DoubleSide} />
    </group>
  )
}

function PenaltySpots() {
  return (
    <group>
      {/* Left */}
      <mesh position={[-HALF_LENGTH + PENALTY_SPOT_DIST, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      {/* Right */}
      <mesh position={[HALF_LENGTH - PENALTY_SPOT_DIST, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      {/* Center */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
    </group>
  )
}

function Grass() {
  // "Blue Lock" Cyber-Grid / Dark Grass
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[120, 80]} />
      <meshStandardMaterial
        color="#0a1a1a" // Deep cyber dark
        emissive="#001100"
        roughness={0.8}
      />
    </mesh>
  )
}

export function Field() {
  return (
    <group>
      <Grass />
      <PitchLines />
      <CenterCircle />
      <PenaltySpots />
    </group>
  )
}

