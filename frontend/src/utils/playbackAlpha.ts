// Sub-frame interpolation alpha (0–1) between currentFrame and currentFrame+1.
// Written by PlaybackEngine every render frame, read by PlayerTotem/Ball for smooth motion.
// Uses a module-level variable to avoid re-renders.
export let playbackAlpha = 0

export function setPlaybackAlpha(a: number) {
  playbackAlpha = a
}
