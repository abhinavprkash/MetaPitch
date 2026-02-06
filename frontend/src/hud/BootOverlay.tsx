import { useState, useEffect } from 'react'
import { useStore } from '../store'
import styles from './BootOverlay.module.css'

export function BootOverlay() {
  const booting = useStore((s) => s.booting)
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const ready = !booting

  function handleEnter() {
    setFading(true)
    setTimeout(() => setVisible(false), 600)
  }

  if (!visible) return null

  return (
    <div className={`${styles.overlay} ${fading ? styles.fadeOut : ''}`}>
      <div className={styles.shape}>
        <svg viewBox="0 0 100 100" className={styles.svg}>
          {/* Outer rotating ring */}
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="0.5"
          />
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            strokeDasharray="20 232"
            strokeLinecap="round"
            className={styles.ringOuter}
          />
          {/* Inner counter-rotating ring */}
          <circle
            cx="50" cy="50" r="28"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="0.5"
          />
          <circle
            cx="50" cy="50" r="28"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.8"
            strokeDasharray="12 164"
            strokeLinecap="round"
            className={styles.ringInner}
          />
          {/* Center dot */}
          <circle
            cx="50" cy="50" r="3"
            fill="#ffffff"
            className={styles.pulse}
          />
          {/* Cross hairs */}
          <line x1="50" y1="42" x2="50" y2="35" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.5" />
          <line x1="50" y1="58" x2="50" y2="65" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.5" />
          <line x1="42" y1="50" x2="35" y2="50" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.5" />
          <line x1="58" y1="50" x2="65" y2="50" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.5" />
        </svg>
      </div>
      <div className={styles.label}>METAVISION</div>
      {ready ? (
        <button className={styles.enterBtn} onClick={handleEnter}>
          ENTER
        </button>
      ) : (
        <div className={styles.sublabel}>INITIALIZING</div>
      )}
      <div className={styles.scanline} />
    </div>
  )
}
