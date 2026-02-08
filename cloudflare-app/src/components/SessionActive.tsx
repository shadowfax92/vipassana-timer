import type { AudioProgress } from '../types'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

interface SessionActiveProps {
  label: string
  timeRemaining: number
  progress: AudioProgress
  showProgressBar: boolean
  onSkip: () => void
  onStop: () => void
}

export function SessionActive({
  label,
  timeRemaining,
  progress,
  showProgressBar,
  onSkip,
  onStop,
}: SessionActiveProps) {
  const displayTime = timeRemaining > 0
    ? formatTime(timeRemaining)
    : progress.duration > 0
      ? formatTime(Math.max(0, Math.ceil(progress.duration - progress.current)))
      : '--:--'

  return (
    <div className="session">
      <div className="phase-indicator">
        {label}
      </div>

      <div className="timer">
        <div className="time-display">{displayTime}</div>
      </div>

      {showProgressBar && progress.duration > 0 && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${(progress.current / progress.duration) * 100}%` }}
          />
        </div>
      )}

      <div className="session-actions">
        <button className="skip-button" onClick={onSkip}>
          Skip →
        </button>
        <button className="stop-button" onClick={onStop}>
          Stop Session
        </button>
      </div>

      <p className="screen-hint">Keep screen on during session</p>
    </div>
  )
}
