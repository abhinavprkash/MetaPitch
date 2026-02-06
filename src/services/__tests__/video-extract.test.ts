import { describe, it, expect } from 'vitest'
import { MockVideoExtractor } from '../video-extract/mock.js'

describe('MockVideoExtractor', () => {
  it('returns 22 players + ball', async () => {
    const ext = new MockVideoExtractor()
    const result = await ext.extract({ type: 'image' })

    expect(result.source).toBe('video')
    expect(result.frameCount).toBe(1)
    expect(result.frames).toHaveLength(1)
    const ids = Object.keys(result.players)
    expect(ids).toContain('ball')
    expect(ids.length).toBe(23)
  })

  it('has 11 home and 11 away players', async () => {
    const ext = new MockVideoExtractor()
    const result = await ext.extract({ type: 'image' })

    const teams = Object.values(result.players).map(p => p.team)
    expect(teams.filter(t => t === 'home').length).toBe(11)
    expect(teams.filter(t => t === 'away').length).toBe(11)
    expect(teams.filter(t => t === 'ball').length).toBe(1)
  })

  it('positions are within field bounds', async () => {
    const ext = new MockVideoExtractor()
    const result = await ext.extract({ type: 'image' })

    for (const [, [x, y]] of Object.entries(result.frames[0].positions)) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(120)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(53.3)
    }
  })

  it('gameId and playId are null', async () => {
    const ext = new MockVideoExtractor()
    const result = await ext.extract({ type: 'image' })

    expect(result.gameId).toBeNull()
    expect(result.playId).toBeNull()
  })

  it('includes meta with play description', async () => {
    const ext = new MockVideoExtractor()
    const result = await ext.extract({ type: 'image' })

    expect(result.meta).toBeDefined()
    expect(result.meta!.offense).toBe('NE')
    expect(result.meta!.defense).toBe('DEN')
  })

  it('includes events', async () => {
    const ext = new MockVideoExtractor()
    const result = await ext.extract({ type: 'image' })

    expect(result.events).toBeDefined()
    expect(result.events!['1']).toBe('pre_snap')
  })
})
