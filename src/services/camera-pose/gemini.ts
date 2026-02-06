import { GoogleGenAI } from '@google/genai'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROMPT = readFileSync(resolve(__dirname, '../../../prompts/camera-pose.md'), 'utf-8')

export interface CameraPoseResult {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

export class GeminiCameraPoseEstimator {
  private client: GoogleGenAI | null = null

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required')
      this.client = new GoogleGenAI({ apiKey })
    }
    return this.client
  }

  async estimate(base64: string): Promise<CameraPoseResult> {
    const response = await this.getClient().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64, mimeType: 'image/jpeg' } },
            { text: PROMPT },
          ],
        },
      ],
      config: {
        thinkingConfig: { thinkingLevel: 'HIGH' as any },
      },
    })

    const text = response.text ?? ''
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*?\})/)
    if (!jsonMatch) throw new Error('Gemini response did not contain valid JSON')

    const parsed = JSON.parse(jsonMatch[1])

    // The prompt returns { camera: { position, lookAt, fov }, landmarks, confidence }
    const camera = parsed.camera || parsed
    const position = camera.position as [number, number, number]
    const target = (camera.lookAt || camera.target) as [number, number, number]
    const fov = camera.fov as number

    if (!position || !target || !fov) {
      throw new Error('Gemini response missing camera position, target, or fov')
    }

    return { position, target, fov }
  }
}
