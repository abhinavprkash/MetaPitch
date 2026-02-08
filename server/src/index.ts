import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })
import express from 'express'
import cors from 'cors'
import { gamesRouter } from './routes/games.js'
import { playsRouter } from './routes/plays.js'
import { playersRouter } from './routes/players.js'
import { predictRouter } from './routes/predict.js'
import { extractRouter } from './routes/extract.js'
import { statsRouter } from './routes/stats.js'
import { cameraPoseRouter } from './routes/cameraPose.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.use('/api/games', gamesRouter)
app.use('/api', playsRouter)
app.use('/api/players', playersRouter)
app.use('/api/predict', predictRouter)
app.use('/api/extract', extractRouter)
app.use('/api/stats', statsRouter)
app.use('/api/camera-pose', cameraPoseRouter)

// Serve frontend static files in production
const frontendDist = resolve(__dirname, '../../frontend/dist')
app.use(express.static(frontendDist))
app.get('*', (_req, res) => {
  res.sendFile(resolve(frontendDist, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`MetaPitch API server running on http://localhost:${PORT}`)
})
