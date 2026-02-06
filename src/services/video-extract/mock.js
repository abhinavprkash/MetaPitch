import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCK_DATA = JSON.parse(readFileSync(resolve(__dirname, '../../../data/mocks/fun-mode-extract.json'), 'utf-8'));
export class MockVideoExtractor {
    async extract(_input) {
        return MOCK_DATA;
    }
}
