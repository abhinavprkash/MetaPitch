import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import styles from './StatsHUD.module.css'

const EVENT_DISPLAY_DURATION = 2500 // ms

export function StatsHUD() {
  const currentPlay = useStore((s) => s.currentPlay)
  const currentFrame = useStore((s) => s.currentFrame)
  const stats = useStore((s) => s.stats)
  const playStats = useStore((s) => s.playStats)
  const statsOverlay = useStore((s) => s.statsOverlay)

  const meta = currentPlay?.meta
  const eventKey = String(currentPlay?.frames[currentFrame]?.id)
  const rawEvent = currentPlay?.events?.[eventKey]

  const [displayEvent, setDisplayEvent] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (rawEvent) {
      setDisplayEvent(rawEvent)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setDisplayEvent(null), EVENT_DISPLAY_DURATION)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [rawEvent])

  const event = displayEvent

  // Ball stats
  const frame = currentPlay?.frames[currentFrame]
  const ballVel = frame?.velocities['ball']
  const ballSpeed = ballVel ? Math.sqrt(ballVel[0] ** 2 + ballVel[1] ** 2) : 0
  const snapBallPos = currentPlay?.frames[0]?.positions['ball']
  const curBallPos = frame?.positions['ball']
  const ballDist = (snapBallPos && curBallPos)
    ? Math.sqrt((curBallPos[0] - snapBallPos[0]) ** 2 + (curBallPos[1] - snapBallPos[1]) ** 2)
    : 0

  // Pull live stats from belief engine if available
  const posterior = playStats && currentFrame < playStats.posteriors.length
    ? playStats.posteriors[currentFrame]
    : undefined
  const delta = playStats && currentFrame > 0 && currentFrame - 1 < playStats.deltas.length
    ? playStats.deltas[currentFrame - 1]
    : undefined
  const expYards = posterior ? posterior.expectedYards : stats.expectedYards
  const endProb = posterior ? posterior.pTouchdown : stats.endzoneProb
  const beliefShift = delta ? delta.deltaPTd : 0

  return (
    <div className={styles.container}>
      {meta && (
        <div className={styles.meta}>
          {meta.offense && meta.defense && (
            <div className={styles.metaTeams}>
              {meta.offense} vs {meta.defense}
            </div>
          )}
          {meta.quarter != null && meta.down != null && meta.yardsToGo != null && (
            <div>
              Q{meta.quarter} &middot; {meta.down}
              {meta.down === 1 ? 'st' : meta.down === 2 ? 'nd' : meta.down === 3 ? 'rd' : 'th'}{' '}
              &amp; {meta.yardsToGo}
            </div>
          )}
        </div>
      )}

      <div className={styles.statsRow}>
        <span className={styles.crosshair}>+</span>
        {playStats && (
          <>
            <div className={styles.stat}>
              <span className={styles.statLabel}>EXP YARDS</span>
              <span className={styles.statValue}>{expYards.toFixed(1)}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>TD PROB</span>
              <span className={styles.statValue}>{(endProb * 100).toFixed(0)}%</span>
            </div>
          </>
        )}
        {statsOverlay && posterior && (
          <>
            <div className={styles.divider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>BELIEF Δ</span>
              <span
                className={styles.statValue}
                style={{ color: beliefShift >= 0 ? '#76ff03' : '#ff6b35' }}
              >
                {beliefShift >= 0 ? '+' : ''}{(beliefShift * 100).toFixed(1)}%
              </span>
            </div>
            <div className={styles.divider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>TURNOVER</span>
              <span className={styles.statValue}>{(posterior.pTurnover * 100).toFixed(0)}%</span>
            </div>
          </>
        )}
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.statLabel}>BALL SPD</span>
          <span className={styles.statValue}>{ballSpeed.toFixed(1)}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.statLabel}>BALL DIST</span>
          <span className={styles.statValue}>{ballDist.toFixed(1)}</span>
        </div>
        <span className={styles.crosshair}>+</span>
      </div>

      {event && <div className={styles.event}>{event.replace(/_/g, ' ')}</div>}
    </div>
  )
}
