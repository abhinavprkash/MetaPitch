export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpPosition(
  current: [number, number, number],
  target: [number, number, number],
  factor: number,
): [number, number, number] {
  return [
    lerp(current[0], target[0], factor),
    lerp(current[1], target[1], factor),
    lerp(current[2], target[2], factor),
  ]
}
