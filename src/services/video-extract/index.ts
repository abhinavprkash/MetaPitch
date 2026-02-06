export type { VideoExtractor } from '../types.js'
import type { VideoExtractor } from '../types.js'
import { MockVideoExtractor } from './mock.js'
import { GeminiVideoExtractor } from './gemini.js'

export function createVideoExtractor(type: 'mock' | 'gemini' = 'mock'): VideoExtractor {
  switch (type) {
    case 'mock':
      return new MockVideoExtractor()
    case 'gemini':
      return new GeminiVideoExtractor()
    default:
      throw new Error(`Unknown extractor type: ${type}`)
  }
}

export { MockVideoExtractor } from './mock.js'
export { GeminiVideoExtractor } from './gemini.js'
