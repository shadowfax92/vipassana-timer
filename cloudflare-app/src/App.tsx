import { useEffect, useLayoutEffect, useState } from 'react'
import './App.css'
import type { SessionPlan } from './lib/sessionPlan'
import { usePreferences } from './hooks/usePreferences'
import { useSessionEngine } from './hooks/useSessionEngine'
import { Icon } from './components/Icon'
import { SessionSetup } from './components/SessionSetup'
import { SessionActive } from './components/SessionActive'
import { SessionComplete } from './components/SessionComplete'
import { SessionError } from './components/SessionError'
import { StartReminder } from './components/StartReminder'

function App() {
  const { preferences, updatePreferences } = usePreferences()
  const engine = useSessionEngine()
  const [pendingPlan, setPendingPlan] = useState<SessionPlan | null>(null)
  useEffect(() => {
    // Safari can carry a focus ring through scripted dialog focus after a tap.
    // Track input at the document boundary (including Tab from outside the app)
    // before focus moves. This changes only its presentation, never focus itself.
    const root = document.documentElement
    const pointer = () => { root.dataset.focusInput = 'pointer' }
    const keyboard = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) delete root.dataset.focusInput
    }
    document.addEventListener('pointerdown', pointer, true)
    document.addEventListener('keydown', keyboard, true)
    return () => {
      document.removeEventListener('pointerdown', pointer, true)
      document.removeEventListener('keydown', keyboard, true)
      delete root.dataset.focusInput
    }
  }, [])
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', preferences.theme === 'dark' ? '#1B1E20' : '#F1F2F2')
  }, [preferences.theme])
  const begin = (plan: SessionPlan) => engine.startSession(plan.steps)
  const start = (plan: SessionPlan) => {
    if (preferences.hideStartReminder) void begin(plan)
    else setPendingPlan(plan)
  }
  return <div className="app">
    <header className="masthead">
      <img src="/buddha-study.png" width="42" height="48" alt="" />
      <h1>Daily Vipassana</h1>
      <p>In the tradition of S. N. Goenka</p>
      <button className="icon-button theme-toggle" aria-label={preferences.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={() => updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })}>
        <Icon name={preferences.theme === 'dark' ? 'sun' : 'moon'} size={22} />
      </button>
    </header>
    {engine.status === 'idle' && <SessionSetup preferences={preferences} onChange={updatePreferences} onStart={start} />}
    {engine.status === 'preparing' && <main className="session">
      <div className="session-center"><p role="status">Preparing audio…</p></div>
      <div className="session-footer"><button className="secondary-button" onClick={engine.stopSession}>End session</button></div>
    </main>}
    {(engine.status === 'active' || engine.status === 'paused') && <SessionActive label={engine.currentStep?.label ?? ''} timeRemaining={engine.timeRemaining}
      progress={engine.progress} showProgressBar={engine.currentStep?.type === 'audio'} onSkip={engine.skip} onStop={engine.stopSession}
      paused={engine.status === 'paused'} continuousGuided={engine.currentStep?.id === 'vipassana_guided'}
      onPause={engine.pause} onResume={() => void engine.resume()} onReset={engine.resetSession} />}
    {engine.status === 'complete' && <SessionComplete onNewSession={engine.stopSession} />}
    {engine.status === 'error' && <SessionError message={engine.errorMessage} onDismiss={engine.stopSession} onRetry={engine.resetSession} />}
    {pendingPlan && <StartReminder onClose={() => setPendingPlan(null)} onConfirm={hide => {
      // Only confirmation starts playback. Dismissing the popup neither consumes
      // sitting time nor saves the checkbox's unconfirmed draft value.
      updatePreferences({ hideStartReminder: hide })
      setPendingPlan(null)
      void begin(pendingPlan)
    }} />}
  </div>
}
export default App
