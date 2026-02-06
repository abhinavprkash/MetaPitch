// Canonical play format — matches contracts/data.md exactly

export interface CanonicalPlay {
  gameId: number | null
  playId: number | null
  meta?: PlayMeta
  frameCount: number
  events?: Record<string, string>
  players: Record<string, PlayerInfo>
  frames: Frame[]
  source: 'kaggle' | 'gemini' | 'mock' | 'video'
}

export interface PlayMeta {
  quarter?: number
  down?: number
  yardsToGo?: number
  offense?: string
  defense?: string
  description?: string
}

export interface PlayerInfo {
  name: string
  team: 'home' | 'away' | 'ball'
  jersey?: number
  position?: string
}

export interface Frame {
  id: number
  positions: Record<string, [number, number]>
  velocities: Record<string, [number, number]>
  orientations: Record<string, number>
}

// Forward simulation input — matches Gemini prompt contract in data.md

export interface SimulationInput {
  gameId: number | null
  playId: number | null
  frameId: number
  horizon: number
  state: Record<string, PlayerSnapshot>
  players: Record<string, PlayerInfo>
}

export interface PlayerSnapshot {
  pos: [number, number]
  vel: [number, number]
  ori: number
  team: 'home' | 'away' | 'ball'
  role?: string
}

// Video extractor input

export interface VideoInput {
  type: 'image' | 'video'
  url?: string
  base64?: string
}

// Service interfaces

export interface ForwardSimulator {
  predict(input: SimulationInput): Promise<CanonicalPlay>
}

export interface VideoExtractor {
  extract(input: VideoInput): Promise<CanonicalPlay>
}

// TranSPORTmer enhanced types

export type GameState = 'pass' | 'possession' | 'uncontrolled' | 'out_of_play'

export type TaskType = 'forecast' | 'impute' | 'infer'

export interface EnhancedSimulationInput extends SimulationInput {
  /** Per-agent, per-frame visibility mask: 0 = observed, 1 = predict */
  observationMask?: Record<string, number[]>
  /** Type of prediction task */
  taskType?: TaskType
}

export interface SocialInteraction {
  from: string
  to: string
  type: 'pass_target' | 'marking' | 'supporting' | 'pressing'
}

export interface PredictionReasoning {
  coarse: string
  interactions: SocialInteraction[]
}

export interface EnhancedCanonicalPlay extends CanonicalPlay {
  /** Per-frame game state classification */
  states?: GameState[]
  /** Per-agent prediction confidence (0-1) */
  confidence?: Record<string, number>
  /** Model's reasoning about the prediction */
  reasoning?: PredictionReasoning
}

export interface ITranSPORTmerSimulator {
  predict(input: EnhancedSimulationInput): Promise<EnhancedCanonicalPlay>
}
