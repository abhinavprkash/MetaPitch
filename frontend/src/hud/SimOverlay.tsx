import { useStore } from '../store'
import styles from './SimOverlay.module.css'

export function SimOverlay() {
  const simulating = useStore((s) => s.simulating)

  if (!simulating) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.shape}>
        <svg viewBox="0 0 100 100" className={styles.svg}>
          {/* Outer rotating ring */}
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="rgba(0, 229, 255, 0.15)"
            strokeWidth="0.5"
          />
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1"
            strokeDasharray="20 232"
            strokeLinecap="round"
            className={styles.ringOuter}
          />
          {/* Inner counter-rotating ring */}
          <circle
            cx="50" cy="50" r="28"
            fill="none"
            stroke="rgba(0, 229, 255, 0.1)"
            strokeWidth="0.5"
          />
          <circle
            cx="50" cy="50" r="28"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="0.8"
            strokeDasharray="12 164"
            strokeLinecap="round"
            className={styles.ringInner}
          />
          {/* Center dot */}
          <circle
            cx="50" cy="50" r="3"
            fill="#00e5ff"
            className={styles.pulse}
          />
          {/* Cross hairs */}
          <line x1="50" y1="42" x2="50" y2="35" stroke="rgba(0, 229, 255, 0.3)" strokeWidth="0.5" />
          <line x1="50" y1="58" x2="50" y2="65" stroke="rgba(0, 229, 255, 0.3)" strokeWidth="0.5" />
          <line x1="42" y1="50" x2="35" y2="50" stroke="rgba(0, 229, 255, 0.3)" strokeWidth="0.5" />
          <line x1="58" y1="50" x2="65" y2="50" stroke="rgba(0, 229, 255, 0.3)" strokeWidth="0.5" />
        </svg>
      </div>
      <div className={styles.label}>SIMULATING</div>
      <div className={styles.sublabel}>FORWARD PROJECTION IN PROGRESS</div>
      <div className={styles.scanline} />
    </div>
  )
}
