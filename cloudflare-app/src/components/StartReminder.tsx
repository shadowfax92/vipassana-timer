import { useId, useState } from 'react'
import { Dialog } from './Dialog'

export function StartReminder({ onClose, onConfirm }: { onClose: () => void; onConfirm: (hide: boolean) => void }) {
  const [hide, setHide] = useState(false)
  const descriptionId = useId()
  return <Dialog title="Keep the app open" kind="modal" descriptionId={descriptionId} onClose={onClose}>
    <p id={descriptionId} className="reminder-copy">Keep your screen unlocked and leave this app open. Locking the screen or switching apps or tabs may interrupt your session.</p>
    <label className="checkbox-row">
      <input type="checkbox" checked={hide} onChange={event => setHide(event.target.checked)} />
      <span>Don’t show this again</span>
    </label>
    <button className="primary-button" onClick={() => onConfirm(hide)}>Start session</button>
  </Dialog>
}
