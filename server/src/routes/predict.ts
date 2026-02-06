import { Router } from 'express'
import { createForwardSimulator } from '../../../src/services/forward-sim/index.js'

export const predictRouter = Router()

predictRouter.post('/', async (req, res) => {
  try {
    const type = req.body.simulator === 'gemini' ? 'gemini' : 'mock'
    const simulator = createForwardSimulator(type)
    const result = await simulator.predict(req.body)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})
