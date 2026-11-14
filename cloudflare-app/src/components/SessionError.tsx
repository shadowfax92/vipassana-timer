export function SessionError({ message, onDismiss, onRetry }: { message: string | null; onDismiss: () => void; onRetry: () => void }) {
  return <main className="complete">
    <div role="alert"><h2>Session interrupted</h2><p>{message || 'Unable to play this session. Please try again.'}</p></div>
    <button className="primary-button" onClick={onRetry}>Try again</button>
    <button className="secondary-button" onClick={onDismiss}>Back to setup</button>
  </main>
}
