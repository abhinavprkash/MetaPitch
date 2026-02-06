import {
  FIELD_HALF_LENGTH,
  FIELD_HALF_WIDTH,
  HASH_Y_LEFT,
  HASH_Y_RIGHT,
} from './constants'

type Segment = [number, number, number, number, number, number] // x1,y1,z1, x2,y2,z2

// All geometry on the Y=0 plane (y in Three.js = up, we use z for field width)

export function generateBoundaryLines(): Float32Array {
  const hl = FIELD_HALF_LENGTH
  const hw = FIELD_HALF_WIDTH
  const segments: Segment[] = [
    // Sidelines
    [-hl, 0, -hw, hl, 0, -hw],
    [-hl, 0, hw, hl, 0, hw],
    // Endlines
    [-hl, 0, -hw, -hl, 0, hw],
    [hl, 0, -hw, hl, 0, hw],
  ]
  return new Float32Array(segments.flat())
}

export function generateEndzoneBoundaries(): Float32Array {
  const hw = FIELD_HALF_WIDTH
  // Endzones at 10 yards from each end = scene x = -50 and +50
  const segments: Segment[] = [
    [-50, 0, -hw, -50, 0, hw],
    [50, 0, -hw, 50, 0, hw],
  ]
  return new Float32Array(segments.flat())
}

export function generateYardLines(): Float32Array {
  const hw = FIELD_HALF_WIDTH
  const segments: Segment[] = []
  // Yard lines every 5 yards from endzone to endzone (field coords 10,15,20...110)
  // Scene coords: -50, -45, -40 ... +50
  for (let sceneX = -50; sceneX <= 50; sceneX += 5) {
    if (sceneX === -50 || sceneX === 50) continue // already drawn as endzone boundaries
    segments.push([sceneX, 0, -hw, sceneX, 0, hw])
  }
  return new Float32Array(segments.flat())
}

export function generateHashMarks(): Float32Array {
  const segments: Segment[] = []
  const hashLen = 0.5

  // Hash marks at every yard from endzone to endzone
  for (let sceneX = -50; sceneX <= 50; sceneX += 1) {
    // Left hash
    segments.push([sceneX, 0, HASH_Y_LEFT - hashLen, sceneX, 0, HASH_Y_LEFT + hashLen])
    // Right hash
    segments.push([sceneX, 0, HASH_Y_RIGHT - hashLen, sceneX, 0, HASH_Y_RIGHT + hashLen])
  }
  return new Float32Array(segments.flat())
}

export function generateSubGrid(): Float32Array {
  const hl = FIELD_HALF_LENGTH
  const hw = FIELD_HALF_WIDTH
  const segments: Segment[] = []

  // Vertical lines (along x) every 1 yard
  for (let x = -hl; x <= hl; x += 1) {
    segments.push([x, 0, -hw, x, 0, hw])
  }
  // Horizontal lines (along z) every 1 yard
  for (let z = Math.ceil(-hw); z <= Math.floor(hw); z += 1) {
    segments.push([-hl, 0, z, hl, 0, z])
  }

  return new Float32Array(segments.flat())
}

export interface YardLabel {
  text: string
  position: [number, number, number]
}

export function generateYardLabels(): YardLabel[] {
  const labels: YardLabel[] = []
  const yardNumbers = [10, 20, 30, 40, 50, 40, 30, 20, 10]
  // These correspond to field coords 20,30,40,50,60,70,80,90,100
  // Scene x: -40,-30,-20,-10,0,10,20,30,40
  const sceneXs = [-40, -30, -20, -10, 0, 10, 20, 30, 40]

  for (let i = 0; i < yardNumbers.length; i++) {
    // Top label (near far sideline)
    labels.push({
      text: String(yardNumbers[i]),
      position: [sceneXs[i], 0.01, -FIELD_HALF_WIDTH + 4],
    })
    // Bottom label (near near sideline)
    labels.push({
      text: String(yardNumbers[i]),
      position: [sceneXs[i], 0.01, FIELD_HALF_WIDTH - 4],
    })
  }
  return labels
}
