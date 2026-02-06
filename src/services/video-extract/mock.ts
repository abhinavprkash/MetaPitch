import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { VideoExtractor, VideoInput, CanonicalPlay } from '../types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MOCK_DATA: CanonicalPlay = JSON.parse(
  readFileSync(resolve(__dirname, '../../../data/mocks/fun-mode-extract.json'), 'utf-8'),
)

export class MockVideoExtractor implements VideoExtractor {
  async extract(_input: VideoInput): Promise<CanonicalPlay> {
    return MOCK_DATA
  }
}
