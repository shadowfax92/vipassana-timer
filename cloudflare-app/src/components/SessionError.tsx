interface SessionErrorProps {
  message: string | null
  onDismiss: () => void
}

export function SessionError({ message, onDismiss }: SessionErrorProps) {
  return (
    <div className="complete">
      <div className="complete-message">
        <span className="complete-icon">⚠️</span>
        <h2>Session Error</h2>
        <p>{message || 'Something went wrong during your session.'}</p>
      </div>
      <button className="start-button" onClick={onDismiss}>
        Try Again
      </button>
    </div>
  )
}
