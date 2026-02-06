import { create } from 'zustand'
import type { PlayData, CameraMode, Stats, PlayStats } from './types'
import { predict, fetchPlayStats, fetchPlay } from './api'

interface MetaPitchStore {
  // Data
  currentPlay: PlayData | null
  availablePlays: Array<{ gameId: number; playId: number; label: string }>
  playIndex: number
  loadingPlay: boolean

  // Playback
  currentFrame: number
  playing: boolean
  looping: boolean
  playbackSpeed: number

  // Camera
  cameraMode: CameraMode

  // Predictions (stubbed for future)
  predictions: PlayData | null

  // Stats
  stats: Stats
  statsOverlay: boolean
  playStats: PlayStats | null
  selectedPlayer: string | null

  // Fork simulation
  dragging: boolean
  dragOverrides: Record<string, [number, number]>
  predictedPlay: PlayData | null
  predictionFrame: number
  simulating: boolean
  forkFrame: number | null
  simEngine: 'mock' | 'gemini'

  // Boot
  booting: boolean

  // Belief engine
  beliefEngineRunning: boolean
  beliefEngineResult: PlayStats | null

  // Actions
  loadPlay: (play: PlayData) => void
  setFrame: (n: number) => void
  tick: () => void
  play: () => void
  pause: () => void
  toggleLoop: () => void
  togglePlay: () => void
  setCameraMode: (mode: CameraMode) => void
  setPredictions: (p: PlayData | null) => void
  toggleStatsOverlay: () => void
  setPlayStats: (s: PlayStats | null) => void
  setSelectedPlayer: (id: string | null) => void
  setDragging: (d: boolean) => void
  setDragOverride: (playerId: string, pos: [number, number]) => void
  setPlaybackSpeed: (speed: number) => void
  clearFork: () => void
  setSimEngine: (e: 'mock' | 'gemini') => void
  runSimulation: () => Promise<void>
  runBeliefEngine: () => Promise<void>
  clearBeliefEngine: () => void
  setAvailablePlays: (plays: Array<{ gameId: number; playId: number; label: string }>, index: number) => void
  loadNextPlay: () => Promise<void>
  loadPrevPlay: () => Promise<void>
}

export const useStore = create<MetaPitchStore>((set, get) => ({
  currentPlay: null,
  availablePlays: [],
  playIndex: 0,
  loadingPlay: false,
  currentFrame: 0,
  playing: false,
  looping: true,
  playbackSpeed: 1,
  cameraMode: '3d',
  predictions: null,
  stats: { expectedYards: 0, separation: 0, endzoneProb: 0 },
  statsOverlay: false,
  playStats: null,
  selectedPlayer: null,
  dragging: false,
  dragOverrides: {},
  predictedPlay: null,
  predictionFrame: 0,
  simulating: false,
  forkFrame: null,
  simEngine: 'mock',
  booting: true,
  beliefEngineRunning: false,
  beliefEngineResult: null,

  loadPlay: (play) => set({
    currentPlay: play,
    currentFrame: 0,
    playing: true,
    predictions: null,
    playStats: null,
    selectedPlayer: null,
  }),

  setFrame: (n) => {
    const play = get().currentPlay
    if (!play) return
    set({ currentFrame: Math.max(0, Math.min(n, play.frames.length - 1)) })
  },

  tick: () => {
    const { currentPlay, predictedPlay, currentFrame, predictionFrame, looping, playStats } = get()
    if (!currentPlay) return

    // When viewing predicted trajectories, advance predictionFrame instead
    if (predictedPlay) {
      const maxFrame = predictedPlay.frames.length - 1
      if (predictionFrame >= maxFrame) {
        if (looping) {
          set({ predictionFrame: 0 })
        } else {
          set({ playing: false })
        }
      } else {
        set({ predictionFrame: predictionFrame + 1 })
      }
      return
    }

    const maxFrame = currentPlay.frames.length - 1
    if (currentFrame >= maxFrame) {
      if (looping) {
        set({ currentFrame: 0 })
      } else {
        set({ playing: false })
      }
    } else {
      const nextFrame = currentFrame + 1
      // Update live stats from playStats if available
      if (playStats && playStats.posteriors[nextFrame]) {
        const p = playStats.posteriors[nextFrame]
        set({
          currentFrame: nextFrame,
          stats: {
            expectedYards: p.expectedYards,
            separation: 0,
            endzoneProb: p.pTouchdown,
          },
        })
      } else {
        set({ currentFrame: nextFrame })
      }
    }
  },

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  toggleLoop: () => set((s) => ({ looping: !s.looping })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setCameraMode: (mode) => {
    set({ cameraMode: mode })
  },
  setPredictions: (p) => set({ predictions: p }),
  toggleStatsOverlay: () => set((s) => ({ statsOverlay: !s.statsOverlay })),
  setPlayStats: (s) => set({ playStats: s }),
  setSelectedPlayer: (id) => set((s) => {
    const newId = s.selectedPlayer === id ? null : id
    if (!newId && s.cameraMode === 'ego') return { selectedPlayer: newId, cameraMode: '3d' as CameraMode }
    return { selectedPlayer: newId }
  }),

  setDragging: (d) => set({ dragging: d }),

  setDragOverride: (playerId, pos) => {
    const { currentPlay, currentFrame } = get()
    if (!currentPlay) return
    const frame = currentPlay.frames[currentFrame]
    const original = frame?.positions[playerId]
    if (!original) return
    const maxDist = playerId === 'ball' ? 40 : 10
    const dx = pos[0] - original[0]
    const dy = pos[1] - original[1]
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return
    const clamped: [number, number] = dist > maxDist
      ? [original[0] + (dx / dist) * maxDist, original[1] + (dy / dist) * maxDist]
      : pos
    set((s) => ({ dragOverrides: { ...s.dragOverrides, [playerId]: clamped } }))
  },

  clearFork: () => {
    const forkFrame = get().forkFrame
    set({ dragOverrides: {}, predictedPlay: null, predictionFrame: 0, forkFrame: null, playing: false, currentFrame: forkFrame ?? get().currentFrame })
  },

  setSimEngine: (e) => set({ simEngine: e, playbackSpeed: e === 'gemini' ? 0.1 : 1 }),

  runSimulation: async () => {
    const { currentPlay, currentFrame, dragOverrides, simEngine } = get()
    if (!currentPlay) return
    set({ simulating: true, forkFrame: currentFrame })
    const frame = currentPlay.frames[currentFrame]
    const prevFrame = currentFrame > 0 ? currentPlay.frames[currentFrame - 1] : null
    const DT = 0.1 // 10 Hz tracking data
    const state: Record<string, { pos: [number, number]; vel: [number, number]; ori: number; team: string }> = {}
    for (const [id, player] of Object.entries(currentPlay.players)) {
      const isDragged = !!dragOverrides[id]
      const pos = dragOverrides[id] || frame.positions[id]
      if (!pos) continue
      let vel: [number, number] = frame.velocities[id] || [0, 0]
      // For dragged players, compute velocity from drag offset so trajectory
      // continues in the direction they were moved
      if (isDragged && prevFrame) {
        const origPos = frame.positions[id]
        if (origPos) {
          vel = [(pos[0] - origPos[0]) / DT, (pos[1] - origPos[1]) / DT]
        }
      }
      const ori = frame.orientations[id] ?? 0
      state[id] = { pos, vel, ori, team: player.team }
    }
    try {
      const result = await predict({
        gameId: currentPlay.gameId,
        playId: currentPlay.playId,
        frameId: frame.id,
        horizon: 60,
        state,
        players: currentPlay.players,
        simulator: simEngine,
      })
      set({ predictedPlay: result, simulating: false, predictionFrame: 0, playing: true, playbackSpeed: simEngine === 'gemini' ? 0.1 : get().playbackSpeed })
    } catch {
      set({ simulating: false })
    }
  },

  runBeliefEngine: async () => {
    const { currentPlay, currentFrame, simEngine } = get()
    if (!currentPlay) return
    set({ beliefEngineRunning: true, forkFrame: currentFrame, beliefEngineResult: null })
    try {
      // TODO: Gemini disabled for Analyze — would launch ~600 API calls (20 sims × 30 frames)
      const engine = simEngine === 'gemini' ? 'mock' : simEngine
      const stats = await fetchPlayStats(currentPlay, engine, currentFrame)
      set({ beliefEngineResult: stats, beliefEngineRunning: false, playStats: stats })
    } catch {
      set({ beliefEngineRunning: false })
    }
  },

  clearBeliefEngine: () => {
    const forkFrame = get().forkFrame
    set({
      beliefEngineResult: null,
      playStats: null,
      forkFrame: null,
      currentFrame: forkFrame ?? get().currentFrame,
    })
  },

  setAvailablePlays: (plays, index) => set({ availablePlays: plays, playIndex: index }),

  loadNextPlay: async () => {
    const { availablePlays, playIndex } = get()
    if (playIndex >= availablePlays.length - 1) return
    const next = availablePlays[playIndex + 1]
    set({ loadingPlay: true })
    try {
      const play = await fetchPlay(next.gameId, next.playId)
      set({ loadingPlay: false, playIndex: playIndex + 1 })
      get().loadPlay(play)
    } catch {
      set({ loadingPlay: false })
    }
  },

  loadPrevPlay: async () => {
    const { availablePlays, playIndex } = get()
    if (playIndex <= 0) return
    const prev = availablePlays[playIndex - 1]
    set({ loadingPlay: true })
    try {
      const play = await fetchPlay(prev.gameId, prev.playId)
      set({ loadingPlay: false, playIndex: playIndex - 1 })
      get().loadPlay(play)
    } catch {
      set({ loadingPlay: false })
    }
  },
}))
