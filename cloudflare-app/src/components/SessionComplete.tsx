export function SessionComplete({ onNewSession }: { onNewSession: () => void }) {
  return <main className="complete">
    <div><h2>Session complete</h2><p>May all beings be happy.</p></div>
    <button className="primary-button" onClick={onNewSession}>New session</button>
  </main>
}
