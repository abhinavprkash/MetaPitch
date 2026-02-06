import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT = readFileSync(resolve(__dirname, '../../../prompts/video-extract.md'), 'utf-8');
// Few-shot example: model response for CIN@NE play (used as demonstration)
const FEW_SHOT_EXAMPLE = JSON.stringify({
    gameId: '2016_06_CIN_NE',
    playId: 1,
    meta: {
        quarter: 2, down: 2, yardsToGo: 6,
        offense: 'NE', defense: 'CIN',
        description: 'Tom Brady pass short right to Julian Edelman for 8 yards to the NE 41.',
    },
    frameCount: 10,
    events: { ball_snap: 1, pass_forward: 4, pass_outcome_caught: 6, tackle: 8 },
    players: {
        v_1: { name: 'Tom Brady', team: 'home', jersey: 12, position: 'QB' },
        v_2: { name: 'James White', team: 'home', jersey: 28, position: 'RB' },
        v_3: { name: 'Julian Edelman', team: 'home', jersey: 11, position: 'WR' },
        v_4: { name: 'Rob Gronkowski', team: 'home', jersey: 87, position: 'TE' },
        v_5: { name: 'Chris Hogan', team: 'home', jersey: 15, position: 'WR' },
        v_6: { name: 'David Andrews', team: 'home', jersey: 60, position: 'C' },
        v_7: { name: 'Joe Thuney', team: 'home', jersey: 62, position: 'LG' },
        v_8: { name: 'Shaq Mason', team: 'home', jersey: 69, position: 'RG' },
        v_9: { name: 'Nate Solder', team: 'home', jersey: 77, position: 'LT' },
        v_10: { name: 'Marcus Cannon', team: 'home', jersey: 61, position: 'RT' },
        v_11: { name: 'Malcolm Mitchell', team: 'home', jersey: 19, position: 'WR' },
        v_12: { name: 'Geno Atkins', team: 'away', jersey: 97, position: 'DT' },
        v_13: { name: 'Domata Peko', team: 'away', jersey: 94, position: 'NT' },
        v_14: { name: 'Carlos Dunlap', team: 'away', jersey: 96, position: 'DE' },
        v_15: { name: 'Wallace Gilberry', team: 'away', jersey: 95, position: 'DE' },
        v_16: { name: 'Vontaze Burfict', team: 'away', jersey: 55, position: 'LB' },
        v_17: { name: 'Karlos Dansby', team: 'away', jersey: 58, position: 'LB' },
        v_18: { name: 'Vincent Rey', team: 'away', jersey: 57, position: 'LB' },
        v_19: { name: 'Adam Jones', team: 'away', jersey: 24, position: 'CB' },
        v_20: { name: 'Dre Kirkpatrick', team: 'away', jersey: 27, position: 'CB' },
        v_21: { name: 'Shawn Williams', team: 'away', jersey: 36, position: 'S' },
        v_22: { name: 'George Iloka', team: 'away', jersey: 43, position: 'S' },
    },
    frames: [
        { id: 1, positions: { v_1: [38.0, 26.7], v_2: [38.0, 30.3], v_3: [42.5, 8.3], v_4: [43.0, 43.3], v_5: [43.0, 5.3], v_6: [43.0, 26.7], v_7: [43.0, 28.8], v_8: [43.0, 24.4], v_9: [43.0, 31.3], v_10: [43.0, 21.9], v_11: [42.5, 13.3], v_12: [44.0, 27.5], v_13: [44.0, 26.0], v_14: [44.0, 22.3], v_15: [44.0, 31.3], v_16: [47.0, 25.3], v_17: [47.0, 30.3], v_18: [48.0, 18.3], v_19: [48.0, 5.3], v_20: [50.0, 43.3], v_21: [55.0, 21.3], v_22: [58.0, 33.3], ball: [43.0, 26.7] }, orientations: { v_1: 0, v_2: 0, v_3: 0, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 180, v_15: 180, v_16: 180, v_17: 180, v_18: 180, v_19: 180, v_20: 180, v_21: 180, v_22: 180 } },
        { id: 2, positions: { v_1: [35.5, 26.7], v_2: [38.2, 30.5], v_3: [44.2, 8.0], v_4: [43.2, 43.5], v_5: [43.2, 5.1], v_6: [43.0, 26.7], v_7: [43.0, 28.8], v_8: [43.0, 24.4], v_9: [43.0, 31.3], v_10: [43.0, 21.9], v_11: [42.7, 13.5], v_12: [44.5, 27.3], v_13: [44.3, 26.2], v_14: [44.5, 22.0], v_15: [44.3, 31.5], v_16: [46.5, 24.8], v_17: [47.2, 30.0], v_18: [48.2, 18.0], v_19: [48.2, 5.5], v_20: [50.0, 43.0], v_21: [54.5, 21.0], v_22: [57.5, 33.0], ball: [35.5, 26.7] }, orientations: { v_1: 0, v_2: 0, v_3: 0, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 180, v_15: 180, v_16: 180, v_17: 180, v_18: 180, v_19: 180, v_20: 180, v_21: 180, v_22: 180 } },
        { id: 3, positions: { v_1: [34.8, 26.7], v_2: [38.5, 30.8], v_3: [46.0, 7.8], v_4: [43.5, 43.8], v_5: [43.5, 4.8], v_6: [43.0, 26.7], v_7: [43.0, 28.8], v_8: [43.0, 24.4], v_9: [43.0, 31.3], v_10: [43.0, 21.9], v_11: [43.0, 13.8], v_12: [45.0, 27.0], v_13: [44.5, 26.5], v_14: [45.0, 21.5], v_15: [44.5, 31.8], v_16: [46.2, 24.0], v_17: [47.5, 29.5], v_18: [48.5, 17.5], v_19: [48.5, 6.0], v_20: [49.8, 42.5], v_21: [54.0, 20.5], v_22: [57.0, 32.5], ball: [34.8, 26.7] }, orientations: { v_1: 15, v_2: 0, v_3: 45, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 180, v_15: 180, v_16: 200, v_17: 180, v_18: 180, v_19: 170, v_20: 180, v_21: 180, v_22: 180 } },
        { id: 4, positions: { v_1: [35.0, 26.7], v_2: [39.0, 31.0], v_3: [47.5, 8.2], v_4: [44.0, 44.0], v_5: [44.0, 4.5], v_6: [43.5, 27.0], v_7: [43.5, 29.0], v_8: [43.5, 24.2], v_9: [43.5, 31.5], v_10: [43.5, 21.7], v_11: [43.5, 14.0], v_12: [45.5, 26.8], v_13: [45.0, 26.8], v_14: [45.5, 21.0], v_15: [45.0, 32.0], v_16: [46.5, 22.0], v_17: [48.0, 28.5], v_18: [49.0, 16.5], v_19: [49.0, 6.5], v_20: [49.5, 42.0], v_21: [53.5, 20.0], v_22: [56.5, 32.0], ball: [36.0, 25.0] }, orientations: { v_1: 30, v_2: 0, v_3: 90, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 200, v_15: 180, v_16: 210, v_17: 200, v_18: 180, v_19: 160, v_20: 180, v_21: 180, v_22: 180 } },
        { id: 5, positions: { v_1: [35.2, 26.8], v_2: [39.5, 31.5], v_3: [48.5, 8.8], v_4: [44.5, 44.2], v_5: [44.5, 4.2], v_6: [44.0, 27.2], v_7: [44.0, 29.2], v_8: [44.0, 24.0], v_9: [44.0, 31.8], v_10: [44.0, 21.5], v_11: [44.0, 14.3], v_12: [46.0, 26.5], v_13: [45.5, 27.0], v_14: [46.0, 20.5], v_15: [45.5, 32.5], v_16: [47.5, 18.0], v_17: [48.5, 27.0], v_18: [49.5, 15.5], v_19: [49.5, 7.0], v_20: [49.2, 41.5], v_21: [53.0, 19.0], v_22: [56.0, 31.5], ball: [42.0, 15.0] }, orientations: { v_1: 30, v_2: 0, v_3: 120, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 210, v_15: 180, v_16: 220, v_17: 210, v_18: 180, v_19: 150, v_20: 180, v_21: 190, v_22: 180 } },
        { id: 6, positions: { v_1: [35.5, 26.9], v_2: [40.0, 32.0], v_3: [49.5, 9.5], v_4: [45.0, 44.5], v_5: [45.0, 4.0], v_6: [44.5, 27.5], v_7: [44.5, 29.5], v_8: [44.5, 23.8], v_9: [44.5, 32.0], v_10: [44.5, 21.3], v_11: [44.5, 14.5], v_12: [46.5, 26.2], v_13: [46.0, 27.2], v_14: [46.5, 20.0], v_15: [46.0, 33.0], v_16: [48.5, 14.0], v_17: [49.0, 25.0], v_18: [50.0, 14.5], v_19: [50.0, 7.5], v_20: [49.0, 41.0], v_21: [52.5, 18.0], v_22: [55.5, 31.0], ball: [49.5, 9.5] }, orientations: { v_3: 45, v_17: 225, v_16: 230, v_1: 30, v_2: 0, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 210, v_15: 180, v_18: 190, v_19: 150, v_20: 180, v_21: 200, v_22: 180 } },
        { id: 7, positions: { v_1: [35.8, 27.0], v_2: [40.5, 32.5], v_3: [50.2, 10.2], v_4: [45.5, 44.8], v_5: [45.5, 3.8], v_6: [45.0, 27.8], v_7: [45.0, 29.8], v_8: [45.0, 23.5], v_9: [45.0, 32.3], v_10: [45.0, 21.0], v_11: [45.0, 14.8], v_12: [47.0, 26.0], v_13: [46.5, 27.5], v_14: [47.0, 19.5], v_15: [46.5, 33.5], v_16: [49.5, 11.5], v_17: [49.8, 11.0], v_18: [50.5, 13.5], v_19: [50.5, 8.0], v_20: [48.8, 40.5], v_21: [52.0, 17.0], v_22: [55.0, 30.5], ball: [50.2, 10.2] }, orientations: { v_3: 0, v_17: 270, v_16: 250, v_1: 30, v_2: 0, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 210, v_15: 180, v_18: 200, v_19: 140, v_20: 180, v_21: 210, v_22: 180 } },
        { id: 8, positions: { v_1: [36.0, 27.0], v_2: [41.0, 33.0], v_3: [50.8, 10.8], v_4: [46.0, 45.0], v_5: [46.0, 3.5], v_6: [45.5, 28.0], v_7: [45.5, 30.0], v_8: [45.5, 23.3], v_9: [45.5, 32.5], v_10: [45.5, 20.8], v_11: [45.5, 15.0], v_12: [47.5, 25.8], v_13: [47.0, 27.8], v_14: [47.5, 19.0], v_15: [47.0, 34.0], v_16: [50.4, 11.0], v_17: [50.6, 11.0], v_18: [51.0, 12.5], v_19: [51.0, 8.5], v_20: [48.5, 40.0], v_21: [51.5, 16.0], v_22: [54.5, 30.0], ball: [50.8, 10.8] }, orientations: { v_3: 30, v_16: 270, v_17: 270, v_1: 30, v_2: 0, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 210, v_15: 180, v_18: 210, v_19: 140, v_20: 180, v_21: 220, v_22: 180 } },
        { id: 9, positions: { v_1: [36.2, 27.0], v_2: [41.5, 33.2], v_3: [51.0, 11.0], v_4: [46.2, 45.0], v_5: [46.2, 3.5], v_6: [45.8, 28.0], v_7: [45.8, 30.0], v_8: [45.8, 23.2], v_9: [45.8, 32.5], v_10: [45.8, 20.8], v_11: [45.8, 15.0], v_12: [47.8, 25.5], v_13: [47.2, 28.0], v_14: [47.8, 18.8], v_15: [47.2, 34.2], v_16: [50.8, 11.0], v_17: [50.9, 11.0], v_18: [51.2, 12.0], v_19: [51.2, 9.0], v_20: [48.3, 39.8], v_21: [51.2, 15.5], v_22: [54.2, 29.5], ball: [51.0, 11.0] }, orientations: { v_3: 90, v_16: 270, v_17: 270, v_1: 30, v_2: 0, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 210, v_15: 180, v_18: 210, v_19: 140, v_20: 180, v_21: 220, v_22: 180 } },
        { id: 10, positions: { v_1: [36.5, 27.0], v_2: [42.0, 33.5], v_3: [51.0, 11.0], v_4: [46.5, 45.0], v_5: [46.5, 3.5], v_6: [46.0, 28.0], v_7: [46.0, 30.0], v_8: [46.0, 23.0], v_9: [46.0, 32.5], v_10: [46.0, 20.5], v_11: [46.0, 15.0], v_12: [48.0, 25.5], v_13: [47.5, 28.0], v_14: [48.0, 18.5], v_15: [47.5, 34.5], v_16: [51.0, 11.0], v_17: [51.0, 11.0], v_18: [51.5, 12.0], v_19: [51.5, 9.0], v_20: [48.0, 39.5], v_21: [51.0, 15.0], v_22: [54.0, 29.0], ball: [51.0, 11.0] }, orientations: { v_3: 90, v_16: 270, v_17: 270, v_1: 30, v_2: 0, v_4: 0, v_5: 0, v_6: 0, v_7: 0, v_8: 0, v_9: 0, v_10: 0, v_11: 0, v_12: 180, v_13: 180, v_14: 210, v_15: 180, v_18: 210, v_19: 140, v_20: 180, v_21: 220, v_22: 180 } },
    ],
    source: 'video',
}, null, 2);
export class GeminiVideoExtractor {
    client = null;
    getClient() {
        if (!this.client) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey)
                throw new Error('GEMINI_API_KEY environment variable is required');
            this.client = new GoogleGenAI({ apiKey });
        }
        return this.client;
    }
    async extract(input) {
        // Build the user part: video/image + prompt
        const userParts = [];
        if (input.url) {
            userParts.push({
                fileData: { fileUri: input.url, mimeType: input.type === 'video' ? 'video/*' : 'image/*' },
            });
        }
        else if (input.base64) {
            userParts.push({
                inlineData: { data: input.base64, mimeType: input.type === 'video' ? 'video/mp4' : 'image/jpeg' },
            });
        }
        userParts.push({ text: PROMPT });
        const response = await this.getClient().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                // Few-shot example: demo video + prompt → expected output
                {
                    role: 'user',
                    parts: [
                        { fileData: { fileUri: 'https://www.youtube.com/watch?v=JfVGoNf6gtI', mimeType: 'video/*' } },
                        { text: PROMPT },
                    ],
                },
                {
                    role: 'model',
                    parts: [{ text: '```json\n' + FEW_SHOT_EXAMPLE + '\n```' }],
                },
                // Actual request
                { role: 'user', parts: userParts },
            ],
            config: {
                thinkingConfig: { thinkingLevel: 'HIGH' },
                tools: [{ googleSearch: {} }],
            },
        });
        // Extract JSON from response
        const text = response.text ?? '';
        const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*?\})/);
        if (!jsonMatch)
            throw new Error('Gemini response did not contain valid JSON');
        const parsed = JSON.parse(jsonMatch[1]);
        // Normalize to canonical format: ensure velocities exist on each frame, events as strings
        const frames = parsed.frames.map((f) => ({
            id: f.id,
            positions: f.positions,
            velocities: f.velocities ?? {},
            orientations: f.orientations ?? {},
        }));
        const events = {};
        if (parsed.events) {
            for (const [k, v] of Object.entries(parsed.events)) {
                events[k] = String(v);
            }
        }
        return {
            gameId: null,
            playId: null,
            meta: parsed.meta,
            frameCount: parsed.frameCount ?? frames.length,
            events,
            players: parsed.players,
            frames,
            source: 'video',
        };
    }
}
