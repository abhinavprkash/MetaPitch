import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store.js'
import type { PlayData } from '../types.js'

const mockPlay: PlayData = {
  gameId: 1,
  playId: 1,
  frameCount: 3,
  players: {
    ball: { name: 'Football', team: 'ball' },
    '1': { name: 'Player1', team: 'home' },
  },
  frames: [
    { id: 1, positions: { ball: [50, 26], '1': [45, 20] }, velocities: {}, orientations: {} },
    { id: 2, positions: { ball: [51, 26], '1': [46, 20] }, velocities: {}, orientations: {} },
    { id: 3, positions: { ball: [52, 26], '1': [47, 20] }, velocities: {}, orientations: {} },
  ],
  source: 'mock',
}

describe('MetaPitchStore', () => {
  beforeEach(() => {
    useStore.setState({
      currentPlay: null,
      currentFrame: 0,
      playing: false,
      looping: true,
      predictions: null,
      cameraMode: '3d',
    })
  })

  it('loadPlay sets currentPlay and resets state', () => {
    useStore.getState().loadPlay(mockPlay)
    const s = useStore.getState()
    expect(s.currentPlay).toBe(mockPlay)
    expect(s.currentFrame).toBe(0)
    expect(s.playing).toBe(true)
    expect(s.predictions).toBeNull()
  })

  it('setFrame clamps to valid range', () => {
    useStore.getState().loadPlay(mockPlay)
    useStore.getState().setFrame(100)
    expect(useStore.getState().currentFrame).toBe(2) // max index

    useStore.getState().setFrame(-5)
    expect(useStore.getState().currentFrame).toBe(0)
  })

  it('setFrame does nothing without a play', () => {
    useStore.getState().setFrame(5)
    expect(useStore.getState().currentFrame).toBe(0)
  })

  it('tick advances frame', () => {
    useStore.getState().loadPlay(mockPlay)
    useStore.getState().tick()
    expect(useStore.getState().currentFrame).toBe(1)
  })

  it('tick at last frame with looping resets to 0', () => {
    useStore.getState().loadPlay(mockPlay)
    useStore.setState({ currentFrame: 2, looping: true })
    useStore.getState().tick()
    expect(useStore.getState().currentFrame).toBe(0)
  })

  it('tick at last frame without looping stops playing', () => {
    useStore.getState().loadPlay(mockPlay)
    useStore.setState({ currentFrame: 2, looping: false, playing: true })
    useStore.getState().tick()
    expect(useStore.getState().playing).toBe(false)
  })

  it('tick does nothing without a play', () => {
    useStore.getState().tick()
    expect(useStore.getState().currentFrame).toBe(0)
  })

  it('play/pause/togglePlay', () => {
    useStore.getState().play()
    expect(useStore.getState().playing).toBe(true)

    useStore.getState().pause()
    expect(useStore.getState().playing).toBe(false)

    useStore.getState().togglePlay()
    expect(useStore.getState().playing).toBe(true)

    useStore.getState().togglePlay()
    expect(useStore.getState().playing).toBe(false)
  })

  it('toggleLoop', () => {
    expect(useStore.getState().looping).toBe(true)
    useStore.getState().toggleLoop()
    expect(useStore.getState().looping).toBe(false)
    useStore.getState().toggleLoop()
    expect(useStore.getState().looping).toBe(true)
  })

  it('setCameraMode', () => {
    useStore.getState().setCameraMode('top')
    expect(useStore.getState().cameraMode).toBe('top')
  })

  it('setPredictions', () => {
    useStore.getState().setPredictions(mockPlay)
    expect(useStore.getState().predictions).toBe(mockPlay)

    useStore.getState().setPredictions(null)
    expect(useStore.getState().predictions).toBeNull()
  })
})
