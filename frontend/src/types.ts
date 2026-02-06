export interface PlayData {
  gameId: number | null
  playId: number | null
  meta?: {
    quarter?: number
    down?: number
    yardsToGo?: number
    offense?: string
    defense?: string
    description?: string
  }
  frameCount: number
  events?: Record<string, string>
  players: Record<string, PlayerIdentity>
  frames: FrameData[]
  source: 'kaggle' | 'gemini' | 'mock' | 'video'
}

export interface PlayerIdentity {
  name: string
  team: 'home' | 'away' | 'ball'
  jersey?: number
  position?: string
}

export interface FrameData {
  id: number
  positions: Record<string, [number, number]>
  velocities: Record<string, [number, number]>
  orientations: Record<string, number>
}

export type BallPhase = 'held' | 'airborne' | 'loose'

export type CameraMode = 'top' | '3d' | 'ego'

export interface Stats {
  expectedYards: number
  separation: number
  endzoneProb: number
}

// Belief engine stats (mirrors src/services/stats/types.ts)

export interface OutcomeDistribution {
  loss: number
  short: number
  medium: number
  long: number
  explosive: number
  touchdown: number
}

export interface FramePosterior {
  frameId: number
  pTouchdown: number
  pTurnover: number
  expectedYards: number
  distribution: OutcomeDistribution
}

export interface BeliefDelta {
  frameId: number
  deltaPTd: number
  klDivergence: number
  isPivotal: boolean
}

export interface PlayerAttribution {
  playerId: string
  frameId: number
  attributionScore: number
  isPositive: boolean
}

export interface PlayerFrameStats {
  playerId: string
  frameId: number
  separation?: number
}

export interface PosteriorTrajectory {
  playerId: string
  meanPath: Array<[number, number]>
  variance: number[]
}

export interface PlayStats {
  posteriors: FramePosterior[]
  deltas: BeliefDelta[]
  attributions: PlayerAttribution[]
  playerStats: PlayerFrameStats[]
  pivotalFrames: number[]
  posteriorTrajectories?: PosteriorTrajectory[]
}
