import { useEffect, useRef } from 'react'
import { useFunModeStore } from './funModeStore'
import './funmode.css'

const REVEAL_DURATION_MS = 3000

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function RevealCompositor() {
  const imageUrl = useFunModeStore((s) => s.funImageDataUrl)
  const revealProgress = useFunModeStore((s) => s.revealProgress)
  const setRevealProgress = useFunModeStore((s) => s.setRevealProgress)
  const setFunPhase = useFunModeStore((s) => s.setFunPhase)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = null

    function step(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const raw = Math.min(elapsed / REVEAL_DURATION_MS, 1)
      const eased = easeInOutCubic(raw)
      setRevealProgress(eased)

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setFunPhase('interactive')
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [setRevealProgress, setFunPhase])

  if (!imageUrl) return null

  const clipPercent = revealProgress * 100

  return (
    <div className="funmode-reveal">
      <img
        src={imageUrl}
        alt="Uploaded field"
        className="funmode-reveal-image"
        style={{ clipPath: `inset(0 0 0 ${clipPercent}%)` }}
        draggable={false}
      />
      <div
        className="funmode-reveal-line"
        style={{ left: `${clipPercent}%` }}
      />
    </div>
  )
}
