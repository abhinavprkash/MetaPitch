// Stats engine types

/** Outcome distribution bucketed by soccer states */
export interface OutcomeDistribution {
  /** Fraction of sims in each bucket */
  turnover: number    // lost possession
  retention: number   // kept possession safely
  progression: number // ball moved significantly forward (>10m)
  opportunity: number // shot or key pass created
  goal: number        // ball in net
}

/** Posterior belief state at a single frame */
export interface FramePosterior {
  frameId: number
  pGoal: number       // probability of goal within horizon
  pTurnover: number   // probability of losing possession
  expectedXG: number  // expected goals (proxy)
  distribution: OutcomeDistribution
}

/** Belief shift between consecutive frames */
export interface BeliefDelta {
  frameId: number
  deltaPGoal: number
  klDivergence: number
  isPivotal: boolean  // KL exceeds threshold
}

/** Per-player attribution for a single frame */
export interface PlayerAttribution {
  playerId: string
  frameId: number
  attributionScore: number  // KL contribution
  isPositive: boolean       // helped offense?
}

/** Role-specific stats for a player at a frame */
export interface PlayerFrameStats {
  playerId: string
  frameId: number
  separation?: number          // distance to nearest opponent
  separationConfLow?: number   // lower confidence band
  separationConfHigh?: number  // upper confidence band
  windowProb?: number          // % of sims with passing window
  pressureIndex?: number       // P(turnover within 10 frames)
  expectedXGAdded?: number     // ball carrier / passer
}

/** Mean + variance per player per predicted frame (for posterior visualization) */
export interface PosteriorTrajectory {
  playerId: string
  /** Mean positions across all sims, one per horizon frame */
  meanPath: Array<[number, number]>
  /** Variance (spread) at each horizon frame — drives glow width */
  variance: number[]
}

/** Full stats package for an entire play */
export interface PlayStats {
  posteriors: FramePosterior[]
  deltas: BeliefDelta[]
  attributions: PlayerAttribution[]  // only for pivotal frames
  playerStats: PlayerFrameStats[]
  pivotalFrames: number[]  // frame IDs with highest KL
  /** Per-player posterior trajectories from the pause frame */
  posteriorTrajectories?: PosteriorTrajectory[]
}
