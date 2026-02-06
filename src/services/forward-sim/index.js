import { MockForwardSimulator } from './mock.js';
import { GeminiForwardSimulator } from './gemini.js';
import { TranSPORTmerSimulator } from './transportmer.js';
export function createForwardSimulator(type = 'mock') {
    switch (type) {
        case 'mock':
            return new MockForwardSimulator();
        case 'gemini':
            return new GeminiForwardSimulator();
        case 'transportmer':
            return new TranSPORTmerSimulator();
        default:
            throw new Error(`Unknown simulator type: ${type}`);
    }
}
export { MockForwardSimulator } from './mock.js';
export { GeminiForwardSimulator } from './gemini.js';
export { TranSPORTmerSimulator } from './transportmer.js';
