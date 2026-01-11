import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

import type {
  Metadata,
  SessionMode,
  ChantingDuration,
  MeditationDuration,
  InstructionType,
  SessionPhase,
  SessionConfig
} from './types'

import { useScreenWake } from './hooks/useScreenWake'
import { useMediaKeepAlive } from './hooks/useMediaKeepAlive'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useMeditationTimer } from './hooks/useMeditationTimer'

import { selectChantingWithRetry } from './utils/chanting'
import { getAudioForPhase, getNextPhase, getFirstPhase } from './utils/phase'

import { SessionSetup } from './components/SessionSetup'
import { SessionActive } from './components/SessionActive'
import { SessionComplete } from './components/SessionComplete'

function App() {
  // Metadata
  const [metadata, setMetadata] = useState<Metadata | null>(null)

  // User settings (persisted in setup screen)
  const [sessionMode, setSessionMode] = useState<SessionMode>('custom')
  const [enableGong, setEnableGong] = useState(false)
  const [introDuration, setIntroDuration] = useState<ChantingDuration>('5min')
  const [meditationDuration, setMeditationDuration] = useState<MeditationDuration>(30)
  const [outroDuration, setOutroDuration] = useState<ChantingDuration>('5min')
  const [instructionType, setInstructionType] = useState<InstructionType>('short')

  // Session state
  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null)

  // Refs for async callbacks
  const phaseRef = useRef<SessionPhase>('idle')
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Hooks
  useScreenWake(phase) // Auto-enables during active session, handles visibility changes
  const {
    start: startKeepAlive,
    playOutro,
    stopPlayback: stopOutroPlayback,
    stop: stopKeepAlive,
    progress: outroProgress,
    timeRemaining: outroTimeRemaining
  } = useMediaKeepAlive()
  const { controls: audioControls, progress: audioProgress, timeRemaining: audioTimeRemaining } = useAudioPlayer()

  const handleMeditationComplete = useCallback(() => {
    if (phaseRef.current === 'meditation') {
      setPhase(getNextPhase('meditation', sessionConfig))
    }
  }, [sessionConfig])

  const { controls: timerControls, timeRemaining: meditationTimeRemaining } = useMeditationTimer(handleMeditationComplete)

  // Load metadata
  useEffect(() => {
    fetch('/audio/metadata.json')
      .then(res => res.json())
      .then(data => setMetadata(data))
      .catch(err => console.error('Failed to load metadata:', err))
  }, [])

  // Prepare session config - selects all audio files upfront
  const prepareSessionConfig = useCallback((): SessionConfig | null => {
    let introFile: string | null = null
    let outroFile: string | null = null

    if (sessionMode === 'custom') {
      if (introDuration !== 'none') {
        introFile = selectChantingWithRetry(metadata, introDuration)
        if (!introFile) {
          console.error('No intro chanting available for', introDuration)
          return null
        }
      }

      if (outroDuration !== 'none') {
        outroFile = selectChantingWithRetry(metadata, outroDuration)
        if (!outroFile) {
          console.error('No outro chanting available for', outroDuration)
          return null
        }
      }
    }

    return {
      mode: sessionMode,
      enableGong,
      introFile,
      outroFile,
      meditationMinutes: meditationDuration,
      instructionType
    }
  }, [metadata, sessionMode, enableGong, introDuration, outroDuration, meditationDuration, instructionType])

  // Start session
  const startSession = useCallback(() => {
    if (!metadata) return

    const config = prepareSessionConfig()
    if (!config) {
      // Could show user error here
      return
    }

    setSessionConfig(config)

    // Start media keep-alive for background audio capability
    // Must be called from user gesture (this is a click handler)
    startKeepAlive()

    setPhase(getFirstPhase(config))
  }, [metadata, prepareSessionConfig, startKeepAlive])

  // Stop session
  const stopSession = useCallback(() => {
    audioControls.stop()
    timerControls.stop()
    stopKeepAlive()
    setPhase('idle')
    setSessionConfig(null)
  }, [audioControls, timerControls, stopKeepAlive])

  // Skip current phase
  const skipPhase = useCallback(() => {
    audioControls.stop()
    if (phase === 'meditation') {
      timerControls.stop()
    }
    // Stop outro playback when skipping outro phases (keeps element primed for next phase)
    if (phase === 'outro_chanting' || phase === 'outro') {
      stopOutroPlayback()
    }
    setPhase(getNextPhase(phase, sessionConfig))
  }, [audioControls, timerControls, phase, sessionConfig, stopOutroPlayback])

  // Stop keep-alive when session ends (handles both natural completion and stop button)
  useEffect(() => {
    if (phase === 'complete' || phase === 'idle') {
      stopKeepAlive()
    }
  }, [phase, stopKeepAlive])

  // Handle phase transitions
  useEffect(() => {
    if (phase === 'idle' || phase === 'complete') return
    if (!sessionConfig) return

    const devMode = import.meta.env.VITE_DEV_MODE === 'true'
    const devSeconds = parseInt(import.meta.env.VITE_DEV_MEDITATION_SECONDS || '30', 10)
    let devTimeout: number | null = null

    const runPhase = async () => {
      try {
        if (phase === 'meditation') {
          // In dev mode, use 1 second per minute of selected duration (e.g., 12 min -> 12 sec)
          const minutes = devMode
            ? sessionConfig.meditationMinutes / 60
            : sessionConfig.meditationMinutes
          timerControls.start(minutes)
          return
        }

        const audioFile = getAudioForPhase(phase, sessionConfig)
        if (audioFile) {
          // In dev mode, set a timeout to skip after devSeconds
          if (devMode) {
            devTimeout = window.setTimeout(() => {
              audioControls.stop()
              // Stop outro playback when skipping (keep-alive stops via phase effect)
              if (phase === 'outro_chanting' || phase === 'outro') {
                stopOutroPlayback()
              }
              if (phaseRef.current === phase) {
                setPhase(getNextPhase(phase, sessionConfig))
              }
            }, devSeconds * 1000)
          }

          // Use source-swap technique for outro phases (works from background!)
          // This is critical: when meditation timer completes in background,
          // the source-swap allows audio to play from the already-playing element
          if (phase === 'outro_chanting' || phase === 'outro') {
            const fadeInSeconds = phase === 'outro_chanting' ? 30 : undefined
            await playOutro(audioFile, { fadeInSeconds })
          } else {
            // Fade in over 30s for intro chanting
            const playOptions = phase === 'intro' ? { fadeInSeconds: 30 } : undefined
            await audioControls.play(audioFile, playOptions)
          }
        }

        // Check phase hasn't changed during playback
        if (phaseRef.current === phase) {
          setPhase(getNextPhase(phase, sessionConfig))
        }
      } catch (err) {
        console.error('Phase execution failed:', err)
        // Gracefully move to next phase on error
        if (phaseRef.current === phase) {
          setPhase(getNextPhase(phase, sessionConfig))
        }
      }
    }

    runPhase()

    return () => {
      if (devTimeout) {
        clearTimeout(devTimeout)
      }
    }
  }, [phase, sessionConfig, audioControls, timerControls, playOutro, stopOutroPlayback])

  const isSessionActive = phase !== 'idle' && phase !== 'complete'

  return (
    <div className="app">
      <header>
        <h1>Daily Vipassana</h1>
        <p className="subtitle">
          Meditation with S.N. Goenka's chantings
          <span className="separator">·</span>
          <a
            className="source-link"
            href="https://github.com/shadowfax92/vipassana-daily-meditation-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
        </p>
      </header>

      {phase === 'idle' && (
        <SessionSetup
          metadata={metadata}
          sessionMode={sessionMode}
          setSessionMode={setSessionMode}
          enableGong={enableGong}
          setEnableGong={setEnableGong}
          introDuration={introDuration}
          setIntroDuration={setIntroDuration}
          meditationDuration={meditationDuration}
          setMeditationDuration={setMeditationDuration}
          outroDuration={outroDuration}
          setOutroDuration={setOutroDuration}
          instructionType={instructionType}
          setInstructionType={setInstructionType}
          onStart={startSession}
        />
      )}

      {isSessionActive && (
        <SessionActive
          phase={phase}
          meditationTimeRemaining={meditationTimeRemaining}
          audioProgress={phase === 'outro_chanting' || phase === 'outro' ? outroProgress : audioProgress}
          audioTimeRemaining={phase === 'outro_chanting' || phase === 'outro' ? outroTimeRemaining : audioTimeRemaining}
          onSkip={skipPhase}
          onStop={stopSession}
        />
      )}

      {phase === 'complete' && (
        <SessionComplete onNewSession={() => setPhase('idle')} />
      )}

      <footer className="app-footer">
        <a href="https://daily-vipassana.app" target="_blank" rel="noopener noreferrer">
          daily-vipassana.app
        </a>
      </footer>
    </div>
  )
}

export default App
