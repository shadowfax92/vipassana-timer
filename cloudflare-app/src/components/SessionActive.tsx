import type { AudioProgress } from '../types'
import { formatCountdown } from '../lib/time'

interface SessionActiveProps {
  label: string
  timeRemaining: number
  progress: AudioProgress
  showProgressBar: boolean
  onSkip: () => void
  onStop: () => void
  paused: boolean
  continuousGuided: boolean
  onPause: () => void
  onResume: () => void
  onReset: () => void
}

/** Presentation only: progress, Skip and Stop still come from the existing engine. */
export function SessionActive({ label, timeRemaining, progress, showProgressBar, onSkip, onStop,
  paused, continuousGuided, onPause, onResume, onReset }: SessionActiveProps) {
  const displayTime = timeRemaining > 0 ? formatCountdown(timeRemaining)
    : progress.duration > 0 ? formatCountdown(Math.max(0, progress.duration - progress.current)) : '—'
  return <main className="session">
    <div className="session-center">
      <h2 className="phase-indicator">{label}</h2>
      <div className="time-display" role="timer" aria-label="Time remaining in this part">{displayTime}</div>
      <p className="supporting" role="status">{paused ? 'Paused'
        : continuousGuided && progress.duration === 0 ? 'Loading recording…' : 'Remaining in this part'}</p>
      {showProgressBar && progress.duration > 0 && <progress className="audio-progress" aria-label="Recording progress" max={progress.duration} value={progress.current} />}
      {continuousGuided ? <>
        <button className="secondary-button" onClick={paused ? onResume : onPause}>{paused ? 'Resume' : 'Pause'}</button>
        <button className="quiet-button" onClick={onReset}>Reset recording</button>
      </> : <button className="quiet-button" onClick={onSkip}>{showProgressBar ? 'Skip recording' : 'Skip silent practice'}</button>}
    </div>
    <div className="session-footer">
      <button className="secondary-button" onClick={onStop}>End session</button>
      <p className="screen-hint">Keep your screen unlocked and the app open.</p>
    </div>
  </main>
}
