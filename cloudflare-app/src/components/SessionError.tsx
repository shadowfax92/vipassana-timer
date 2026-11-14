export function SessionError({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  return <main className="complete">
    <div role="alert"><h2>Session interrupted</h2><p>{message || 'Unable to play this session. Please try again.'}</p></div>
    <button className="primary-button" onClick={onDismiss}>Back to setup</button>
  </main>
}
