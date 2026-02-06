import { Router } from 'express'
import { createVideoExtractor } from '../../../src/services/video-extract/index.js'
import { createForwardSimulator } from '../../../src/services/forward-sim/index.js'
import type { SimulationInput, PlayerSnapshot } from '../../../src/services/types.js'

const AUTO_SIM_THRESHOLD = 3  // frames — auto-extend if extraction returns fewer
const AUTO_SIM_HORIZON = 240  // 24 seconds at 10Hz

export const extractRouter = Router()

// Use 'mock' or 'gemini' based on query param ?source=gemini (default: mock)
extractRouter.post('/', async (req, res) => {
  const source = (req.query.source as string) === 'gemini' ? 'gemini' : 'mock'
  try {
    const extractor = createVideoExtractor(source)
    const result = await extractor.extract(req.body)

    // Auto-extend short extractions (e.g. still images) with forward simulation
    if (result.frames.length <= AUTO_SIM_THRESHOLD && result.frames.length > 0) {
      const lastFrame = result.frames[result.frames.length - 1]
      const state: Record<string, PlayerSnapshot> = {}
      for (const [id, player] of Object.entries(result.players)) {
        const pos = lastFrame.positions[id]
        if (!pos) continue
        const vel = lastFrame.velocities[id] || [0, 0] as [number, number]
        const ori = lastFrame.orientations[id] ?? 0
        state[id] = { pos, vel, ori, team: player.team }
      }

      const simInput: SimulationInput = {
        gameId: result.gameId,
        playId: result.playId,
        frameId: lastFrame.id,
        horizon: AUTO_SIM_HORIZON,
        state,
        players: result.players,
      }

      const simulator = createForwardSimulator('mock')
      const simResult = await simulator.predict(simInput)

      // Append simulated frames (re-number IDs to continue sequence)
      const startId = lastFrame.id + 1
      for (let i = 0; i < simResult.frames.length; i++) {
        simResult.frames[i].id = startId + i
        result.frames.push(simResult.frames[i])
      }
      result.frameCount = result.frames.length
    }

    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})
