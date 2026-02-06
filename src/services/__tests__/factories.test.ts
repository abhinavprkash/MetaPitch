import { describe, it, expect } from 'vitest'
import { createForwardSimulator, MockForwardSimulator, GeminiForwardSimulator } from '../forward-sim/index.js'
import { createVideoExtractor, MockVideoExtractor, GeminiVideoExtractor } from '../video-extract/index.js'

describe('createForwardSimulator', () => {
  it('returns MockForwardSimulator for "mock"', () => {
    const sim = createForwardSimulator('mock')
    expect(sim).toBeInstanceOf(MockForwardSimulator)
  })

  it('returns GeminiForwardSimulator for "gemini"', () => {
    const sim = createForwardSimulator('gemini')
    expect(sim).toBeInstanceOf(GeminiForwardSimulator)
  })

  it('defaults to mock', () => {
    const sim = createForwardSimulator()
    expect(sim).toBeInstanceOf(MockForwardSimulator)
  })

  it('throws for unknown type', () => {
    expect(() => createForwardSimulator('bad' as any)).toThrow('Unknown simulator type')
  })
})

describe('createVideoExtractor', () => {
  it('returns MockVideoExtractor for "mock"', () => {
    const ext = createVideoExtractor('mock')
    expect(ext).toBeInstanceOf(MockVideoExtractor)
  })

  it('returns GeminiVideoExtractor for "gemini"', () => {
    const ext = createVideoExtractor('gemini')
    expect(ext).toBeInstanceOf(GeminiVideoExtractor)
  })

  it('defaults to mock', () => {
    const ext = createVideoExtractor()
    expect(ext).toBeInstanceOf(MockVideoExtractor)
  })

  it('throws for unknown type', () => {
    expect(() => createVideoExtractor('bad' as any)).toThrow('Unknown extractor type')
  })
})
