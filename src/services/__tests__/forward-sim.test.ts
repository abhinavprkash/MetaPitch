import { describe, it, expect } from 'vitest'
import { MockForwardSimulator } from '../forward-sim/mock.js'
import { MockVideoExtractor } from '../video-extract/mock.js'
import type { SimulationInput } from '../types.js'

const sampleInput: SimulationInput = {
  gameId: 2022091200,
  playId: 64,
  frameId: 10,
  horizon: 20,
  state: {
    '35459': { pos: [51.06, 28.55], vel: [2.0, 1.0], ori: 90, team: 'home', role: 'SS' },
    '40000': { pos: [48.0, 30.0], vel: [-1.5, 0.5], ori: 270, team: 'away', role: 'WR' },
    'ball':  { pos: [50.0, 27.0], vel: [3.0, -0.5], ori: 0, team: 'ball' },
  },
  players: {
    '35459': { name: 'K.Jackson', team: 'home', jersey: 22, position: 'SS' },
    '40000': { name: 'J.Smith', team: 'away', jersey: 81, position: 'WR' },
    'ball':  { name: 'Football', team: 'ball' },
  },
}

describe('MockForwardSimulator', () => {
  it('produces correct number of frames', async () => {
    const sim = new MockForwardSimulator()
    const result = await sim.predict(sampleInput)

    expect(result.frameCount).toBe(20)
    expect(result.frames).toHaveLength(20)
    expect(result.source).toBe('mock')
  })

  it('frame IDs continue from input frameId', async () => {
    const sim = new MockForwardSimulator()
    const result = await sim.predict(sampleInput)

    expect(result.frames[0].id).toBe(11)
    expect(result.frames[19].id).toBe(30)
  })

  it('all positions stay within field bounds', async () => {
    const sim = new MockForwardSimulator()
    const result = await sim.predict(sampleInput)

    for (const frame of result.frames) {
      for (const [, [x, y]] of Object.entries(frame.positions)) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(120)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(53.3)
      }
    }
  })

  it('velocities decrease over time due to friction', async () => {
    const sim = new MockForwardSimulator()
    const result = await sim.predict(sampleInput)

    const firstVx = result.frames[0].velocities['35459'][0]
    const lastVx = result.frames[19].velocities['35459'][0]
    expect(Math.abs(lastVx)).toBeLessThan(Math.abs(firstVx))
  })

  it('includes all players in every frame', async () => {
    const sim = new MockForwardSimulator()
    const result = await sim.predict(sampleInput)

    for (const frame of result.frames) {
      expect(Object.keys(frame.positions)).toEqual(['35459', '40000', 'ball'])
    }
  })

  it('preserves player map from input', async () => {
    const sim = new MockForwardSimulator()
    const result = await sim.predict(sampleInput)

    expect(result.players).toEqual(sampleInput.players)
  })
})

describe('MockVideoExtractor', () => {
  it('returns 22 players + ball', async () => {
    const ext = new MockVideoExtractor()
    const result = await ext.extract({ type: 'image' })

    expect(result.source).toBe('video')
    expect(result.frameCount).toBe(1)
    expect(result.frames).toHaveLength(1)
    // 22 players + ball
    const ids = Object.keys(result.players)
    expect(ids).toContain('ball')
    expect(ids.length).toBe(23)
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
})
