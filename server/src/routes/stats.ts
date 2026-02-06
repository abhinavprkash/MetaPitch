import { Router } from 'express'
import { createForwardSimulator } from '../../../src/services/forward-sim/index.js'
import { computePlayStats } from '../../../src/services/stats/index.js'

export const statsRouter = Router()

statsRouter.post('/', async (req, res) => {
  try {
    const play = req.body
    if (!play || !play.frames || !play.players) {
      res.status(400).json({ error: 'Invalid play data' })
      return
    }
    const type = req.body.simulator === 'gemini' ? 'gemini' : 'mock'
    const simulator = createForwardSimulator(type)
    const pauseFrame = typeof req.body.pauseFrame === 'number' ? req.body.pauseFrame : undefined
    const stats = await computePlayStats(play, simulator, pauseFrame)
    res.json(stats)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
