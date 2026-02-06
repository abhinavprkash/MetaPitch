import { Router } from 'express'
import { getGames } from '../db.js'

export const gamesRouter = Router()

gamesRouter.get('/', (req, res) => {
  const season = req.query.season ? Number(req.query.season) : undefined
  const week = req.query.week ? Number(req.query.week) : undefined
  if ((req.query.season && Number.isNaN(season)) || (req.query.week && Number.isNaN(week))) {
    res.status(400).json({ error: 'season and week must be numeric' })
    return
  }
  res.json(getGames(season, week))
})
