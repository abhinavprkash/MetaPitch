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
  expectedXG: number
  separation: number
  goalProb: number
}

// Belief engine stats (mirrors src/services/stats/types.ts)

export interface OutcomeDistribution {
  turnover: number
  retention: number
  progression: number
  opportunity: number
  goal: number
}

export interface FramePosterior {
  frameId: number
  pGoal: number
  pTurnover: number
  expectedXG: number
  distribution: OutcomeDistribution
}

export interface BeliefDelta {
  frameId: number
  deltaPGoal: number
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
