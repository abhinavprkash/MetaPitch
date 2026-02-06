import { describe, it, expect } from 'vitest'
import { lerp, lerpPosition } from '../utils/interpolation.js'
import { toScene, FIELD_HALF_LENGTH, FIELD_HALF_WIDTH, FIELD_LENGTH, FIELD_WIDTH } from '../utils/constants.js'

describe('lerp', () => {
  it('interpolates at t=0.5', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
  })

  it('returns a at t=0', () => {
    expect(lerp(3, 7, 0)).toBe(3)
  })

  it('returns b at t=1', () => {
    expect(lerp(3, 7, 1)).toBe(7)
  })

  it('handles negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0)
  })
})

describe('lerpPosition', () => {
  it('interpolates all three components', () => {
    const result = lerpPosition([0, 0, 0], [10, 20, 30], 0.5)
    expect(result).toEqual([5, 10, 15])
  })

  it('returns current at t=0', () => {
    const result = lerpPosition([1, 2, 3], [10, 20, 30], 0)
    expect(result).toEqual([1, 2, 3])
  })

  it('returns target at t=1', () => {
    const result = lerpPosition([1, 2, 3], [10, 20, 30], 1)
    expect(result).toEqual([10, 20, 30])
  })
})

describe('toScene', () => {
  it('converts field center to scene origin', () => {
    const [x, y, z] = toScene(FIELD_HALF_LENGTH, FIELD_HALF_WIDTH)
    expect(x).toBe(0)
    expect(y).toBe(0)
    expect(z).toBe(0)
  })

  it('converts field origin (0,0) to negative corner', () => {
    const [x, , z] = toScene(0, 0)
    expect(x).toBe(-FIELD_HALF_LENGTH)
    expect(z).toBe(-FIELD_HALF_WIDTH)
  })

  it('converts far corner', () => {
    const [x, , z] = toScene(FIELD_LENGTH, FIELD_WIDTH)
    expect(x).toBe(FIELD_HALF_LENGTH)
    expect(z).toBeCloseTo(FIELD_HALF_WIDTH)
  })
})

describe('constants', () => {
  it('field dimensions are correct', () => {
    expect(FIELD_LENGTH).toBe(120)
    expect(FIELD_WIDTH).toBe(53.3)
    expect(FIELD_HALF_LENGTH).toBe(60)
    expect(FIELD_HALF_WIDTH).toBeCloseTo(26.65)
  })
})
