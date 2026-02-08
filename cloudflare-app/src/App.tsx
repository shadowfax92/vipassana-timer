import { useState, useEffect } from 'react'
import './App.css'

import type {
  Metadata,
  SessionMode,
  ChantingDuration,
  MeditationDuration,
  InstructionType,
} from './types'

import { useSessionEngine } from './hooks/useSessionEngine'
import { resolveSessionSteps } from './phases/registry'

import { SessionSetup } from './components/SessionSetup'
import { SessionActive } from './components/SessionActive'
import { SessionComplete } from './components/SessionComplete'
import { SessionError } from './components/SessionError'

function App() {
  const [metadata, setMetadata] = useState<Metadata | null>(null)

  const [sessionMode, setSessionMode] = useState<SessionMode>('custom')
  const [enableGong, setEnableGong] = useState(false)
  const [introDuration, setIntroDuration] = useState<ChantingDuration>('5min')
  const [meditationDuration, setMeditationDuration] = useState<MeditationDuration>(30)
  const [outroDuration, setOutroDuration] = useState<ChantingDuration>('5min')
  const [instructionType, setInstructionType] = useState<InstructionType>('short')

  const engine = useSessionEngine()

  useEffect(() => {
    fetch('/audio/metadata.json')
      .then(res => res.json())
      .then(setMetadata)
      .catch(err => console.error('Failed to load metadata:', err))
  }, [])

  const handleStart = () => {
    if (!metadata) return
    const config = {
      mode: sessionMode,
      enableGong,
      introDuration,
      outroDuration,
      meditationMinutes: meditationDuration,
      instructionType,
    }
    const steps = resolveSessionSteps(config, metadata)
    engine.startSession(steps)
  }

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

      {engine.status === 'idle' && (
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
          onStart={handleStart}
        />
      )}

      {engine.status === 'active' && engine.currentStep && (
        <SessionActive
          label={engine.currentStep.label}
          timeRemaining={engine.timeRemaining}
          progress={engine.progress}
          showProgressBar={engine.currentStep.type === 'audio'}
          onSkip={engine.skip}
          onStop={engine.stopSession}
        />
      )}

      {engine.status === 'complete' && (
        <SessionComplete onNewSession={engine.stopSession} />
      )}

      {engine.status === 'error' && (
        <SessionError message={engine.errorMessage} onDismiss={engine.stopSession} />
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
