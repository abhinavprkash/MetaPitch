import { create } from 'zustand'

export interface CameraPose {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

export type FunPhase = 'idle' | 'uploading' | 'extracting' | 'revealing' | 'interactive'
export type FunSource = 'image' | 'url'

interface FunModeStore {
  funPhase: FunPhase
  funSource: FunSource
  funImageDataUrl: string | null
  funCameraPose: CameraPose | null
  revealProgress: number
  error: string | null

  enterFunMode: () => void
  exitFunMode: () => void
  setFunImage: (dataUrl: string) => void
  setFunCameraPose: (pose: CameraPose) => void
  setFunPhase: (phase: FunPhase) => void
  setRevealProgress: (t: number) => void
  setFunSource: (source: FunSource) => void
  setError: (msg: string | null) => void
}

export const useFunModeStore = create<FunModeStore>((set) => ({
  funPhase: 'idle',
  funSource: 'image',
  funImageDataUrl: null,
  funCameraPose: null,
  revealProgress: 0,
  error: null,

  enterFunMode: () => set({
    funPhase: 'uploading',
    funSource: 'image',
    funImageDataUrl: null,
    funCameraPose: null,
    revealProgress: 0,
    error: null,
  }),

  exitFunMode: () => set({
    funPhase: 'idle',
    funSource: 'image',
    funImageDataUrl: null,
    funCameraPose: null,
    revealProgress: 0,
    error: null,
  }),

  setFunImage: (dataUrl) => set({ funImageDataUrl: dataUrl }),
  setFunCameraPose: (pose) => set({ funCameraPose: pose }),
  setFunPhase: (phase) => set({ funPhase: phase }),
  setRevealProgress: (t) => set({ revealProgress: t }),
  setFunSource: (source) => set({ funSource: source }),
  setError: (msg) => set({ error: msg }),
}))
