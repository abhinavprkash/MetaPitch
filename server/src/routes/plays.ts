import { Router } from 'express'
import { getPlaysForGame, getPlayData } from '../db.js'

export const playsRouter = Router()

// List plays for a game
playsRouter.get('/games/:gameId/plays', (req, res) => {
  const gameId = Number(req.params.gameId)
  if (Number.isNaN(gameId)) {
    res.status(400).json({ error: 'gameId must be numeric' })
    return
  }
  res.json(getPlaysForGame(gameId))
})

// Get full canonical play data
playsRouter.get('/plays/:gameId/:playId', (req, res) => {
  const gameId = Number(req.params.gameId)
  const playId = Number(req.params.playId)
  if (Number.isNaN(gameId) || Number.isNaN(playId)) {
    res.status(400).json({ error: 'gameId and playId must be numeric' })
    return
  }
  const data = getPlayData(gameId, playId)
  if (!data) {
    res.status(404).json({ error: 'Play not found' })
    return
  }
  res.json(data)
})
