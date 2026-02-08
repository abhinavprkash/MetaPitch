import { Router } from 'express'
import { createForwardSimulator } from '../../../src/services/forward-sim/index.js'

export const predictRouter = Router()

predictRouter.post('/', async (req, res) => {
  console.log('[Predict] Received request, simulator:', req.body.simulator)
  try {
    const type = req.body.simulator === 'gemini' ? 'gemini' : 'mock'
    console.log('[Predict] Using simulator type:', type)
    const simulator = createForwardSimulator(type)
    const result = await simulator.predict(req.body)
    console.log('[Predict] Success, frames:', result.frames?.length)
    res.json(result)
  } catch (err: any) {
    console.error('[Predict] ERROR:', err.message)
    console.error('[Predict] Stack:', err.stack)
    res.status(400).json({ error: err.message, stack: err.stack })
  }
})

