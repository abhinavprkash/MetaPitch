import { Router } from 'express'
import { getPlayer } from '../db.js'

export const playersRouter = Router()

playersRouter.get('/:nflId', (req, res) => {
  const nflId = Number(req.params.nflId)
  if (Number.isNaN(nflId)) {
    res.status(400).json({ error: 'nflId must be numeric' })
    return
  }
  const player = getPlayer(nflId)
  if (!player) {
    res.status(404).json({ error: 'Player not found' })
    return
  }
  res.json(player)
})
