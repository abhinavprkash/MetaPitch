import type { PlayData, PlayStats } from './types'

const API =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:3000' : '')

export interface GameSummary {
  game_id: number
  season: number
  week: number
  game_date: string
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
}

export interface PlaySummary {
  play_id: number
  quarter: number
  down: number
  yards_to_go: number
  offense_team: string
  defense_team: string
  play_result: number
  description: string
  frame_count: number
}

export async function fetchGames(season?: number, week?: number): Promise<GameSummary[]> {
  const params = new URLSearchParams()
  if (season) params.set('season', String(season))
  if (week) params.set('week', String(week))
  const qs = params.toString()
  const res = await fetch(`${API}/api/games${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error(`Failed to fetch games: ${res.status}`)
  return res.json()
}

export async function fetchPlays(gameId: number): Promise<PlaySummary[]> {
  const res = await fetch(`${API}/api/games/${gameId}/plays`)
  if (!res.ok) throw new Error(`Failed to fetch plays: ${res.status}`)
  return res.json()
}

export async function fetchPlay(gameId: number, playId: number): Promise<PlayData> {
  const res = await fetch(`${API}/api/plays/${gameId}/${playId}`)
  if (!res.ok) throw new Error(`Failed to fetch play: ${res.status}`)
  return res.json()
}

export async function predict(input: unknown): Promise<PlayData> {
  const res = await fetch(`${API}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Prediction failed: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function extractVideo(
  input: { type: 'image' | 'video'; url?: string; base64?: string },
  source: 'mock' | 'gemini' = 'mock',
): Promise<PlayData> {
  const res = await fetch(`${API}/api/extract?source=${source}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Extract failed: ${res.status}`)
  return res.json()
}

export async function fetchPlayStats(
  play: PlayData,
  simulator?: string,
  pauseFrame?: number,
): Promise<PlayStats> {
  const res = await fetch(`${API}/api/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...play, simulator, pauseFrame }),
  })
  if (!res.ok) throw new Error(`Stats computation failed: ${res.status}`)
  return res.json()
}
