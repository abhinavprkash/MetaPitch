import { GoogleGenAI } from '@google/genai'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { ForwardSimulator, SimulationInput, CanonicalPlay, Frame } from '../types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROMPT = readFileSync(resolve(__dirname, '../../../prompts/blue-lock-vision.md'), 'utf-8')

export class GeminiForwardSimulator implements ForwardSimulator {
  private client: GoogleGenAI | null = null

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required')
      this.client = new GoogleGenAI({ apiKey })
    }
    return this.client
  }

  async predict(input: SimulationInput): Promise<CanonicalPlay> {
    const { gameId, playId, frameId, horizon, state, players } = input

    const compactInput = JSON.stringify({ frameId, horizon, state }, null, 2)

    const response = await this.getClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        { role: 'user', parts: [{ text: PROMPT + '\n\n## Current State\n\n```json\n' + compactInput + '\n```' }] },
      ],
      config: {
        thinkingConfig: { thinkingLevel: 'HIGH' as any },
      },
    })

    const text = response.text ?? ''
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*?\])/)
    if (!jsonMatch) throw new Error('Gemini response did not contain valid JSON')

    const parsed = JSON.parse(jsonMatch[1])
    const rawFrames: any[] = Array.isArray(parsed) ? parsed : parsed.frames ?? []

    const frames: Frame[] = rawFrames.map((f: any, i: number) => ({
      id: f.id ?? frameId + i + 1,
      positions: f.positions ?? {},
      velocities: f.velocities ?? {},
      orientations: f.orientations ?? {},
    }))

    return {
      gameId,
      playId,
      frameCount: frames.length,
      events: {},
      players,
      frames,
      source: 'gemini',
    }
  }
}
