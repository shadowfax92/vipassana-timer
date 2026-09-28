import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * One modal seam for setup sheets and the start reminder. Native dialog owns
 * background inertness; this module owns keyboard wrapping, scroll locking and
 * restoring the trigger on dismissal. Only one dialog is mounted at a time.
 */
export function Dialog({ title, kind = 'sheet', descriptionId, onClose, children }: {
  title: string
  kind?: 'sheet' | 'modal'
  descriptionId?: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current!
    const trigger = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [])
  return <dialog ref={ref} className={`dialog dialog--${kind}`} aria-labelledby={titleId} aria-describedby={descriptionId}
    onKeyDown={event => {
      if (event.key !== 'Tab') return
      // Explicit traversal also works when Safari's system preference excludes
      // buttons from normal Tab order. The modal keeps a consistent local loop.
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]'))
        .filter(element => element.tabIndex >= 0 && !element.hasAttribute('disabled') && element.getClientRects().length > 0)
      if (!controls.length) return
      event.preventDefault()
      const index = controls.findIndex(element => element === document.activeElement)
      const next = index < 0 ? (event.shiftKey ? controls.length - 1 : 0)
        : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
      controls[next].focus()
    }}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const box = event.currentTarget.getBoundingClientRect()
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose()
    }}>
    <div className="dialog-heading">
      <h2 id={titleId}>{title}</h2>
      <button className="icon-button" aria-label={`Close ${title}`} onClick={onClose}><Icon name="close" /></button>
    </div>
    {children}
  </dialog>
}
