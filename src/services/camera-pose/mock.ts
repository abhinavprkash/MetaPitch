import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

export interface CameraPoseResult {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const MOCK_POSE: CameraPoseResult = JSON.parse(
  readFileSync(resolve(__dirname, '../../../data/mocks/fun-mode-camera-pose.json'), 'utf-8'),
)

export class MockCameraPoseEstimator {
  async estimate(_base64: string): Promise<CameraPoseResult> {
    return MOCK_POSE
  }
}
