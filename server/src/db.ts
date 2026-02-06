import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'metapitch.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true })
    db.pragma('cache_size = -500000') // ~500MB
  }
  return db
}

// Prepared statements for hot queries

export function getGames(season?: number, week?: number) {
  const db = getDb()
  // Mock Soccer Schema: no season/week/score columns
  return db.prepare(
    'SELECT game_id, game_date, home_team, away_team, stadium FROM games ORDER BY game_date DESC'
  ).all()
}

export function getPlaysForGame(gameId: number) {
  const db = getDb()
  return db.prepare(
    'SELECT play_id, description, frame_count FROM plays WHERE game_id = ? ORDER BY play_id'
  ).all(gameId)
}

export function getPlayData(gameId: number, playId: number) {
  const db = getDb()

  const play = db.prepare(
    'SELECT * FROM plays WHERE game_id = ? AND play_id = ?'
  ).get(gameId, playId) as any

  if (!play) return null

  const frameRows = db.prepare(
    'SELECT * FROM frames WHERE game_id = ? AND play_id = ? ORDER BY frame_id, nfl_id'
  ).all(gameId, playId) as any[]

  if (frameRows.length === 0) return null

  // Build players map and frames array
  const players: Record<string, any> = {}
  const eventsMap: Record<string, string> = {}
  const framesMap = new Map<number, { positions: Record<string, [number, number]>; velocities: Record<string, [number, number]>; orientations: Record<string, number> }>()

  for (const row of frameRows) {
    const playerId = row.nfl_id == null || row.nfl_id === -1 ? 'ball' : String(row.nfl_id)

    // Build player identity
    if (!players[playerId]) {
      players[playerId] = {
        name: row.display_name || (row.team === 'ball' ? 'Ball' : 'Unknown'),
        team: row.team === 'home' || row.team === 'away' || row.team === 'ball' ? row.team : 'home',
        ...(row.jersey_number != null && { jersey: row.jersey_number }),
      }
    }

    if (row.event) {
      eventsMap[String(row.frame_id)] = row.event
    }

    if (!framesMap.has(row.frame_id)) {
      framesMap.set(row.frame_id, { positions: {}, velocities: {}, orientations: {} })
    }
    const frame = framesMap.get(row.frame_id)!
    frame.positions[playerId] = [row.x, row.y]

    if (row.vx != null && row.vy != null) {
      frame.velocities[playerId] = [row.vx, row.vy]
    }
    if (row.orientation != null) {
      frame.orientations[playerId] = row.orientation
    }
  }

  const frames = Array.from(framesMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([id, data]) => ({ id, ...data }))

  return {
    gameId,
    playId,
    meta: {
      description: play.description,
      quarter: 1, // Mock defaults
      down: 1,
      yardsToGo: 10,
      offense: 'Home',
      defense: 'Away'
    },
    frameCount: frames.length,
    events: eventsMap,
    players,
    frames,
    source: 'mock' as const,
  }
}

export function getPlayer(nflId: number) {
  const db = getDb()
  return db.prepare('SELECT * FROM players WHERE nfl_id = ?').get(nflId)
}
