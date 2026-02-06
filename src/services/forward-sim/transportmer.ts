import { GoogleGenAI } from '@google/genai'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type {
  EnhancedSimulationInput,
  EnhancedCanonicalPlay,
  Frame,
  GameState,
  PredictionReasoning,
  ITranSPORTmerSimulator,
} from '../types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROMPT = readFileSync(resolve(__dirname, '../../../prompts/transportmer-prompt.md'), 'utf-8')

/**
 * TranSPORTmer-inspired forward simulator using Gemini 3 Flash Preview.
 * 
 * Implements concepts from the TranSPORTmer paper:
 * - Temporal attention: Analyzes motion patterns over time
 * - Social attention: Models agent-agent interactions
 * - State classification: Identifies game states per frame
 * - Coarse-to-fine: Two-stage reasoning for accurate predictions
 */
export class TranSPORTmerSimulator implements ITranSPORTmerSimulator {
  private client: GoogleGenAI | null = null

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required')
      this.client = new GoogleGenAI({ apiKey })
    }
    return this.client
  }

  /**
   * Build observation mask from input state for the given horizon.
   * For forecasting: all past frames observed (0), all future frames to predict (1)
   */
  private buildObservationMask(
    input: EnhancedSimulationInput
  ): Record<string, number[]> {
    if (input.observationMask) {
      return input.observationMask
    }

    // Default: forecast task - predict all future frames for all agents
    const mask: Record<string, number[]> = {}
    for (const agentId of Object.keys(input.state)) {
      mask[agentId] = Array(input.horizon).fill(1) // All frames to predict
    }
    return mask
  }

  async predict(input: EnhancedSimulationInput): Promise<EnhancedCanonicalPlay> {
    const { gameId, playId, frameId, horizon, state, players } = input
    const taskType = input.taskType ?? 'forecast'
    const observationMask = this.buildObservationMask(input)

    const compactInput = JSON.stringify({
      frameId,
      horizon,
      taskType,
      observationMask,
      state,
    }, null, 2)

    const response = await this.getClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: PROMPT + '\n\n## Current State\n\n```json\n' + compactInput + '\n```' }],
        },
      ],
      config: {
        thinkingConfig: { thinkingLevel: 'HIGH' as any },
      },
    })

    const text = response.text ?? ''
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) throw new Error('Gemini response did not contain valid JSON')

    const parsed = JSON.parse(jsonMatch[1])

    // Extract frames
    const rawFrames: any[] = Array.isArray(parsed) ? parsed : parsed.frames ?? []
    const frames: Frame[] = rawFrames.map((f: any, i: number) => ({
      id: f.id ?? frameId + i + 1,
      positions: f.positions ?? {},
      velocities: f.velocities ?? {},
      orientations: f.orientations ?? {},
    }))

    // Extract game states
    const rawStates: string[] = parsed.states ?? []
    const states: GameState[] = rawStates.map((s: string) => {
      const normalized = s.toLowerCase().replace(/[^a-z_]/g, '')
      if (['pass', 'possession', 'uncontrolled', 'out_of_play'].includes(normalized)) {
        return normalized as GameState
      }
      return 'uncontrolled' // Default fallback
    })

    // Extract confidence scores
    const confidence: Record<string, number> = parsed.confidence ?? {}

    // Extract reasoning
    const reasoning: PredictionReasoning | undefined = parsed.reasoning
      ? {
        coarse: parsed.reasoning.coarse ?? '',
        interactions: parsed.reasoning.interactions ?? [],
      }
      : undefined

    return {
      gameId,
      playId,
      frameCount: frames.length,
      events: {},
      players,
      frames,
      source: 'gemini',
      states,
      confidence,
      reasoning,
    }
  }
}
