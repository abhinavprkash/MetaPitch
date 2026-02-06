import { Router } from 'express'
import { GeminiCameraPoseEstimator } from '../../../src/services/camera-pose/gemini.js'
import { MockCameraPoseEstimator } from '../../../src/services/camera-pose/mock.js'

export const cameraPoseRouter = Router()

cameraPoseRouter.post('/', async (req, res) => {
  const { base64 } = req.body
  const source = (req.query.source as string) === 'gemini' ? 'gemini' : 'mock'

  if (source === 'gemini' && (!base64 || typeof base64 !== 'string')) {
    return res.status(400).json({ error: 'base64 field is required' })
  }

  try {
    const estimator = source === 'gemini'
      ? new GeminiCameraPoseEstimator()
      : new MockCameraPoseEstimator()
    const result = await estimator.estimate(base64 ?? '')
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})
