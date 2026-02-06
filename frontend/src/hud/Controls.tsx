import { useStore } from '../store'
import { useFunModeStore } from '../funmode/funModeStore'
import styles from './Controls.module.css'

export function Controls() {
  const funPhase = useFunModeStore((s) => s.funPhase)
  const enterFunMode = useFunModeStore((s) => s.enterFunMode)
  const playing = useStore((s) => s.playing)
  const looping = useStore((s) => s.looping)
  const currentFrame = useStore((s) => s.currentFrame)
  const currentPlay = useStore((s) => s.currentPlay)
  const predictedPlay = useStore((s) => s.predictedPlay)
  const predictionFrame = useStore((s) => s.predictionFrame)
  const cameraMode = useStore((s) => s.cameraMode)
  const statsOverlay = useStore((s) => s.statsOverlay)
  const selectedPlayer = useStore((s) => s.selectedPlayer)
  const dragOverrides = useStore((s) => s.dragOverrides)
  const simulating = useStore((s) => s.simulating)
  const simEngine = useStore((s) => s.simEngine)
  const setSimEngine = useStore((s) => s.setSimEngine)
  const beliefEngineRunning = useStore((s) => s.beliefEngineRunning)
  const beliefEngineResult = useStore((s) => s.beliefEngineResult)
  const togglePlay = useStore((s) => s.togglePlay)
  const toggleLoop = useStore((s) => s.toggleLoop)
  const setFrame = useStore((s) => s.setFrame)
  const setCameraMode = useStore((s) => s.setCameraMode)
  const playbackSpeed = useStore((s) => s.playbackSpeed)
  const setPlaybackSpeed = useStore((s) => s.setPlaybackSpeed)
  const toggleStatsOverlay = useStore((s) => s.toggleStatsOverlay)
  const runSimulation = useStore((s) => s.runSimulation)
  const clearFork = useStore((s) => s.clearFork)
  const runBeliefEngine = useStore((s) => s.runBeliefEngine)
  const clearBeliefEngine = useStore((s) => s.clearBeliefEngine)

  const availablePlays = useStore((s) => s.availablePlays)
  const playIndex = useStore((s) => s.playIndex)
  const loadingPlay = useStore((s) => s.loadingPlay)
  const loadNextPlay = useStore((s) => s.loadNextPlay)
  const loadPrevPlay = useStore((s) => s.loadPrevPlay)

  // Hide normal controls during fun mode upload/extract/reveal phases
  if (funPhase !== 'idle' && funPhase !== 'interactive') return null

  const inPrediction = !!predictedPlay
  const totalFrames = inPrediction
    ? (predictedPlay?.frames.length ?? 0)
    : (currentPlay?.frames.length ?? 0)
  const displayFrame = inPrediction ? predictionFrame : currentFrame
  const locked = beliefEngineRunning

  const playLabel = loadingPlay
    ? 'LOADING...'
    : currentPlay?.meta?.description
      ? currentPlay.meta.description.length > 60
        ? currentPlay.meta.description.slice(0, 57) + '...'
        : currentPlay.meta.description
      : currentPlay?.meta
        ? `Q${currentPlay.meta.quarter ?? '?'} ${currentPlay.meta.down ?? '?'}&${currentPlay.meta.yardsToGo ?? '?'} — ${currentPlay.meta.offense ?? '?'} vs ${currentPlay.meta.defense ?? '?'}`
        : ''

  return (
    <>
    {/* Play navigation */}
    {availablePlays.length > 0 && (
      <div className={styles.playNav}>
        <button
          className={styles.btn}
          onClick={loadPrevPlay}
          disabled={playIndex <= 0 || loadingPlay || locked}
        >
          &#9664;
        </button>
        <span className={styles.playLabel}>{playLabel}</span>
        <button
          className={styles.btn}
          onClick={loadNextPlay}
          disabled={playIndex >= availablePlays.length - 1 || loadingPlay || locked}
        >
          &#9654;
        </button>
      </div>
    )}
    <div className={styles.container}>
      {/* LEFT: Camera, Stats, Lock indicator */}
      <div className={styles.left}>
        {locked && (
          <div className={styles.lockIndicator}>
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ marginRight: 6 }}>
              <rect x="1" y="6" width="10" height="7" rx="1" stroke="#00e5ff" strokeWidth="1" fill="none" />
              <path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="#00e5ff" strokeWidth="1" fill="none" />
            </svg>
            COMPUTING...
          </div>
        )}

        <div className={styles.group}>
          <button
            className={`${styles.btn} ${cameraMode === 'top' ? styles.btnActive : ''}`}
            onClick={() => setCameraMode('top')}
            disabled={locked}
          >
            TOP
          </button>
          <button
            className={`${styles.btn} ${cameraMode === '3d' ? styles.btnActive : ''}`}
            onClick={() => setCameraMode('3d')}
            disabled={locked}
          >
            3D
          </button>
          <button
            className={`${styles.btn} ${cameraMode === 'ego' ? styles.btnActive : ''}`}
            onClick={() => {
              const current = useStore.getState().cameraMode
              setCameraMode(current === 'ego' ? '3d' : 'ego')
            }}
            title="First-person view — click a player"
          >
            EGO
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <button
            className={`${styles.btn} ${statsOverlay ? styles.btnActive : ''}`}
            onClick={toggleStatsOverlay}
            disabled={locked}
          >
            STATS
          </button>
        </div>
      </div>

      {/* CENTER: Playback — fixed position */}
      <div className={styles.center}>
        <div className={styles.group}>
          <button className={styles.btn} onClick={togglePlay} disabled={locked}>
            {playing ? 'PAUSE' : 'PLAY'}
          </button>
          <button
            className={`${styles.btn} ${looping ? styles.btnActive : ''}`}
            onClick={toggleLoop}
            disabled={locked}
          >
            LOOP
          </button>
        </div>

        <input
          type="range"
          className={styles.scrubber}
          min={0}
          max={Math.max(0, totalFrames - 1)}
          value={displayFrame}
          onChange={(e) => !inPrediction && setFrame(Number(e.target.value))}
          disabled={locked || inPrediction}
        />

        <span className={styles.frameCount}>
          {inPrediction ? `P ${displayFrame + 1}` : `${displayFrame + 1}`} / {totalFrames}
        </span>

        <input
          type="range"
          className={styles.scrubber}
          min={0.1}
          max={2.0}
          step={0.05}
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          disabled={locked}
          style={{ width: 20 }}
        />
        <span className={styles.frameCount}>
          {playbackSpeed.toFixed(2)}x
        </span>
      </div>

      {/* RIGHT: Fun mode, Sim controls */}
      <div className={styles.right}>
        <div className={styles.group}>
          <button className={styles.btn} onClick={enterFunMode} disabled={locked}>
            FUN
          </button>
        </div>

        {!playing && !locked && (Object.keys(dragOverrides).length > 0 || predictedPlay || beliefEngineResult) && (
          <>
            <div className={styles.divider} />
            <div className={styles.group}>
              <button
                className={`${styles.btn} ${simEngine === 'mock' ? styles.btnActive : ''}`}
                onClick={() => setSimEngine('mock')}
              >
                MOCK
              </button>
              <button
                className={`${styles.btn} ${simEngine === 'gemini' ? styles.btnActive : ''}`}
                onClick={() => setSimEngine('gemini')}
                title="Use Gemini AI for forward simulation"
              >
                GEMINI
              </button>
            </div>
          </>
        )}

        {!playing && !locked && Object.keys(dragOverrides).length > 0 && !predictedPlay && !beliefEngineResult && (
          <button
            className={styles.btn}
            onClick={runSimulation}
            disabled={simulating}
          >
            {simulating ? 'SIM...' : 'SIMULATE'}
          </button>
        )}

        {!playing && !locked && !predictedPlay && !beliefEngineResult && Object.keys(dragOverrides).length === 0 && (
          <>
            <div className={styles.divider} />
            <button
              className={styles.btn}
              onClick={runBeliefEngine}
            >
              ANALYZE
            </button>
          </>
        )}

        {beliefEngineResult && !locked && (
          <>
            <div className={styles.divider} />
            <button className={styles.btn} onClick={clearBeliefEngine}>
              CLEAR
            </button>
          </>
        )}

        {predictedPlay && !beliefEngineResult && (
          <>
            <div className={styles.divider} />
            <button className={styles.btn} onClick={clearFork}>
              CLEAR
            </button>
          </>
        )}
      </div>
    </div>
    </>
  )
}
