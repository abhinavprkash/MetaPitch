import { describe, it, expect } from 'vitest'
import {
  generateBoundaryLines,
  generateEndzoneBoundaries,
  generateYardLines,
  generateHashMarks,
  generateSubGrid,
  generateYardLabels,
} from '../utils/fieldGeometry.js'

describe('generateBoundaryLines', () => {
  it('returns Float32Array with 4 segments (24 floats)', () => {
    const result = generateBoundaryLines()
    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(24) // 4 segments × 6 floats
  })
})

describe('generateEndzoneBoundaries', () => {
  it('returns Float32Array with 2 segments (12 floats)', () => {
    const result = generateEndzoneBoundaries()
    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(12)
  })
})

describe('generateYardLines', () => {
  it('returns correct number of yard lines', () => {
    const result = generateYardLines()
    // Every 5 yards from -50 to +50 = 21 positions, minus 2 endzone boundaries = 19 lines
    expect(result.length).toBe(19 * 6)
  })
})

describe('generateHashMarks', () => {
  it('returns hash marks for every yard', () => {
    const result = generateHashMarks()
    // 101 yard positions (-50 to +50) × 2 hashes (left + right) = 202 segments
    expect(result.length).toBe(202 * 6)
  })
})

describe('generateSubGrid', () => {
  it('returns a Float32Array', () => {
    const result = generateSubGrid()
    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('generateYardLabels', () => {
  it('returns 18 labels (9 numbers × 2 sides)', () => {
    const labels = generateYardLabels()
    expect(labels.length).toBe(18)
  })

  it('labels have correct structure', () => {
    const labels = generateYardLabels()
    for (const label of labels) {
      expect(label).toHaveProperty('text')
      expect(label).toHaveProperty('position')
      expect(label.position).toHaveLength(3)
    }
  })

  it('includes expected yard numbers', () => {
    const labels = generateYardLabels()
    const texts = labels.map(l => l.text)
    expect(texts).toContain('50')
    expect(texts).toContain('10')
    expect(texts).toContain('40')
  })
})
