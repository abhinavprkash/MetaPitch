// Field dimensions in Meters (FIFA Standard)
export const FIELD_LENGTH = 105
export const FIELD_WIDTH = 68
export const GOAL_WIDTH = 7.32
export const PENALTY_AREA_WIDTH = 40.32
export const PENALTY_AREA_DEPTH = 16.5
export const ENDZONE_DEPTH = 0 // No endzones in soccer
export const HASH_Y_LEFT = -3 // Dummy value for build fix
export const HASH_Y_RIGHT = 3 // Dummy value for build fix

// Scene coordinates: origin at field center
export const FIELD_HALF_LENGTH = FIELD_LENGTH / 2 // 52.5
export const FIELD_HALF_WIDTH = FIELD_WIDTH / 2 // 34

// Colors
export const BLUE_LOCK_BLACK = '#0a0a12'
export const CYAN = '#00e5ff'
export const WHITE = '#e0e0e0'
export const CYAN_HEX = 0x00e5ff
export const WHITE_HEX = 0xe0e0e0
export const ORANGE_ACCENT = '#ff6b35'

// Opacity
export const SUBGRID_OPACITY = 0.06
export const YARD_LINE_OPACITY = 0.4
export const BOUNDARY_OPACITY = 0.7
export const HASH_OPACITY = 0.25

// Camera
export const PERSPECTIVE_POSITION: [number, number, number] = [0, 50, 60] // Slightly higher for soccer
export const AUTO_ROTATE_SPEED = 0.3
export const IDLE_TIMEOUT_MS = 8000

// Playback
export const FRAME_INTERVAL = 0.1 // 10 Hz

// Convert data coords (0..105, 0..68) to scene coords (-52.5..52.5, -34..34)
// Data origin is bottom-left corner. Scene origin is center.
export function toScene(x: number, y: number): [number, number, number] {
  return [x - FIELD_HALF_LENGTH, 0, y - FIELD_HALF_WIDTH]
}
