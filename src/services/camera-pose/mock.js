import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCK_POSE = JSON.parse(readFileSync(resolve(__dirname, '../../../data/mocks/fun-mode-camera-pose.json'), 'utf-8'));
export class MockCameraPoseEstimator {
    async estimate(_base64) {
        return MOCK_POSE;
    }
}
