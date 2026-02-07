import { useRef, useState, useCallback } from 'react'
import { useFunModeStore } from './funModeStore'
import { RevealCompositor } from './RevealCompositor'
import { useStore } from '../store'
import { extractVideo } from '../api'
import './funmode.css'

const API =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:3000' : '')

async function estimateCameraPose(base64: string, source: 'mock' | 'gemini' = 'mock') {
  const res = await fetch(`${API}/api/camera-pose?source=${source}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64 }),
  })
  if (!res.ok) throw new Error(`Camera pose estimation failed: ${res.status}`)
  return res.json()
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix to get raw base64
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function FunModeOverlay() {
  const funPhase = useFunModeStore((s) => s.funPhase)
  const funImageDataUrl = useFunModeStore((s) => s.funImageDataUrl)
  const error = useFunModeStore((s) => s.error)
  const setFunImage = useFunModeStore((s) => s.setFunImage)
  const setFunCameraPose = useFunModeStore((s) => s.setFunCameraPose)
  const setFunPhase = useFunModeStore((s) => s.setFunPhase)
  const setError = useFunModeStore((s) => s.setError)
  const exitFunMode = useFunModeStore((s) => s.exitFunMode)

  const loadPlay = useStore((s) => s.loadPlay)

  const funSource = useFunModeStore((s) => s.funSource)
  const setFunSource = useFunModeStore((s) => s.setFunSource)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    setFunPhase('extracting')
    setError(null)

    try {
      const [base64, dataUrl] = await Promise.all([
        readFileAsBase64(file),
        readFileAsDataUrl(file),
      ])
      setFunImage(dataUrl)

      // Fire both API calls in parallel (use 'mock' to avoid Gemini quota issues)
      const [playData, cameraPose] = await Promise.all([
        extractVideo({ type: 'image', base64 }, 'mock'),
        estimateCameraPose(base64, 'mock'),
      ])

      loadPlay(playData)
      useStore.getState().setPlaybackSpeed(0.1)
      setFunCameraPose(cameraPose)
      setFunPhase('revealing')
    } catch (err: any) {
      setError(err.message || 'Extraction failed')
      setFunPhase('uploading')
    }
  }, [setFunPhase, setError, setFunImage, loadPlay, setFunCameraPose])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleUrl = useCallback(async () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return

    try {
      new URL(trimmed)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setFunSource('url')
    setFunPhase('extracting')
    setError(null)

    try {
      const playData = await extractVideo({ type: 'video', url: trimmed }, 'gemini')
      loadPlay(playData)
      useStore.getState().setPlaybackSpeed(0.1)
      setFunPhase('interactive')
    } catch (err: any) {
      setError(err.message || 'Extraction failed')
      setFunPhase('uploading')
    }
  }, [urlInput, setFunSource, setFunPhase, setError, loadPlay])

  if (funPhase === 'idle') return null

  // ── Upload Phase ──
  if (funPhase === 'uploading') {
    return (
      <div className="funmode-upload">
        <div
          className={`funmode-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="funmode-dropzone-label">Drop Field Image</span>
          <span className="funmode-dropzone-hint">or click to browse</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />
        </div>
        <div className="funmode-divider">
          <span className="funmode-divider-line" />
          <span className="funmode-divider-text">or paste a video link</span>
          <span className="funmode-divider-line" />
        </div>
        <div className="funmode-url-row">
          <input
            type="text"
            className="funmode-url-input"
            placeholder="https://youtube.com/watch?v=..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleUrl() }}
          />
          <button className="funmode-btn funmode-url-btn" onClick={handleUrl}>
            Extract
          </button>
        </div>
        {error && <div className="funmode-error">{error}</div>}
        <button className="funmode-cancel-btn" onClick={exitFunMode}>
          Cancel
        </button>
      </div>
    )
  }

  // ── Extracting Phase ──
  if (funPhase === 'extracting') {
    return (
      <div className="funmode-extracting">
        {funSource === 'image' && funImageDataUrl && (
          <img
            src={funImageDataUrl}
            alt="Analyzing"
            className="funmode-extracting-image"
            draggable={false}
          />
        )}
        <div className="funmode-scanline" />
        <div className="funmode-extracting-label">
          {funSource === 'url' ? 'Extracting from Video...' : 'Analyzing Formation...'}
        </div>
        {error && <div className="funmode-error">{error}</div>}
      </div>
    )
  }

  // ── Revealing Phase ──
  if (funPhase === 'revealing') {
    return <RevealCompositor />
  }

  // ── Interactive Phase ──
  // Normal Controls HUD is visible during this phase (for drag/simulate flow).
  // We only render the Exit button here.
  if (funPhase === 'interactive') {
    return (
      <div className="funmode-interactive" style={{ justifyContent: 'flex-end', paddingRight: 32 }}>
        <button className="funmode-btn funmode-btn-exit" onClick={exitFunMode}>
          Exit Fun Mode
        </button>
      </div>
    )
  }

  return null
}
