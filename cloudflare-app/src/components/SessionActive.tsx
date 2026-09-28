import type { AudioProgress } from '../types'
import { formatCountdown } from '../lib/time'

interface SessionActiveProps {
  label: string
  timeRemaining: number
  progress: AudioProgress
  showProgressBar: boolean
  onSkip: () => void
  onStop: () => void
}

/** Presentation only: progress, Skip and Stop still come from the existing engine. */
export function SessionActive({ label, timeRemaining, progress, showProgressBar, onSkip, onStop }: SessionActiveProps) {
  const displayTime = timeRemaining > 0 ? formatCountdown(timeRemaining)
    : progress.duration > 0 ? formatCountdown(Math.max(0, progress.duration - progress.current)) : '—'
  return <main className="session">
    <div className="session-center">
      <h2 className="phase-indicator">{label}</h2>
      <div className="time-display" role="timer" aria-label="Time remaining in this part">{displayTime}</div>
      <p className="supporting">Remaining in this part</p>
      {showProgressBar && progress.duration > 0 && <progress className="audio-progress" aria-label="Recording progress" max={progress.duration} value={progress.current} />}
      <button className="quiet-button" onClick={onSkip}>{showProgressBar ? 'Skip recording' : 'Skip silent practice'}</button>
    </div>
    <div className="session-footer">
      <button className="secondary-button" onClick={onStop}>End session</button>
      <p className="screen-hint">Keep your screen unlocked and the app open.</p>
    </div>
  </main>
}
