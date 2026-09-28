import { useEffect, useId, useState } from 'react'
import type { Preferences } from '../lib/preferences'
import type { SessionPlan } from '../lib/sessionPlan'
import { buildSessionPlan, MAX_MINUTES, MIN_MINUTES } from '../lib/sessionPlan'
import { formatClock, formatCountdown, formatDuration, formatFinish } from '../lib/time'
import { Dialog } from './Dialog'
import { Icon } from './Icon'

interface SetupProps {
  preferences: Preferences
  onChange: (patch: Partial<Preferences>) => void
  onStart: (plan: SessionPlan) => void
}

function PlaySelect({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (value: boolean) => void }) {
  const id = useId()
  return <div className="audio-option">
    <label htmlFor={id}>{label}</label>
    <div className="select-wrap">
      <select id={id} value={enabled ? 'play' : 'skip'} onChange={event => onChange(event.target.value === 'play')}>
        <option value="skip">Skip</option><option value="play">Play</option>
      </select><Icon name="down" size={16} />
    </div>
  </div>
}

function audioSummary(settings: Preferences): string {
  const parts = []
  if (settings.enableGong) parts.push('Opening gong')
  if (settings.introDuration === 'default' && settings.outroDuration === 'default') parts.push('chanting')
  else {
    if (settings.introDuration === 'default') parts.push('intro chanting')
    if (settings.outroDuration === 'default') parts.push('outro chanting')
  }
  return parts.length ? parts.join(' and ') + ' on' : 'Opening gong and chanting off'
}

function AudioSettings({ preferences, onChange, onClose }: SetupProps & { onClose: () => void }) {
  const [draft, setDraft] = useState(preferences)
  const set = (patch: Partial<Preferences>) => setDraft(previous => ({ ...previous, ...patch }))
  return <Dialog title="Audio & gongs" onClose={onClose}>
    <p className="supporting">Your {preferences.totalMinutes}-minute duration stays the same.</p>
    <div className="audio-options">
      <PlaySelect label="Opening gong" enabled={draft.enableGong} onChange={enableGong => set({ enableGong })} />
      <PlaySelect label="Intro chanting" enabled={draft.introDuration === 'default'} onChange={play => set({ introDuration: play ? 'default' : 'none' })} />
      <PlaySelect label="Outro chanting" enabled={draft.outroDuration === 'default'} onChange={play => set({ outroDuration: play ? 'default' : 'none' })} />
      <PlaySelect label="Mettā" enabled={draft.enableMetta} onChange={enableMetta => set({ enableMetta })} />
    </div>
    <button className="primary-button" onClick={() => {
      // Commit only the fields owned by this sheet, preserving the reminder
      // preference and any unrelated settings in the shared cookie record.
      onChange({ enableGong: draft.enableGong, introDuration: draft.introDuration,
        outroDuration: draft.outroDuration, enableMetta: draft.enableMetta })
      onClose()
    }}>Done</button>
  </Dialog>
}

function DurationPicker({ preferences, onChange, onClose }: SetupProps & { onClose: () => void }) {
  const [value, setValue] = useState(String(preferences.totalMinutes))
  const minutes = Number(value)
  const valid = value !== '' && Number.isInteger(minutes) && minutes >= MIN_MINUTES && minutes <= MAX_MINUTES
  return <Dialog title="Meditation duration" onClose={onClose}>
    <form className="dialog-form" onSubmit={event => { event.preventDefault(); if (valid) { onChange({ totalMinutes: minutes }); onClose() } }}>
      <label className="duration-entry">Minutes
        <input autoFocus type="number" inputMode="numeric" min={MIN_MINUTES} max={MAX_MINUTES} step="1" required
          value={value} onChange={event => setValue(event.target.value)} aria-describedby="duration-help" />
      </label>
      <p id="duration-help" className="supporting">1–180 minutes, including all selected audio and gongs.</p>
      <button type="submit" className="primary-button" disabled={!valid}>Done</button>
    </form>
  </Dialog>
}

export function SessionSetup(props: SetupProps) {
  const { preferences: settings, onChange, onStart } = props
  // Focus each dialog trigger explicitly: Safari does not focus pointer-clicked
  // buttons, and dismissal must still return to the control that opened it.
  const [panel, setPanel] = useState<'audio' | 'duration' | 'details' | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    const visible = () => { if (document.visibilityState === 'visible') setNow(Date.now()) }
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', visible) }
  }, [])
  const result = buildSessionPlan(settings)
  const plan = result.ok ? result.plan : null
  const isCustom = settings.mode === 'custom'
  const customDuration = settings.totalMinutes !== 45 && settings.totalMinutes !== 60
  return <main className="setup">
    <nav className="mode-tabs" aria-label="Session format">
      <button aria-pressed={isCustom} onClick={() => onChange({ mode: 'custom' })}>Custom</button>
      <button aria-pressed={!isCustom} onClick={() => onChange({ mode: 'guided' })}>Guided</button>
    </nav>
    {isCustom ? <>
      <section className="duration-section" aria-labelledby="duration-label">
        <h2 id="duration-label">Meditation duration</h2>
        <div className="duration-presets">
          {[45, 60].map(minutes => <button key={minutes} aria-pressed={settings.totalMinutes === minutes} onClick={() => onChange({ totalMinutes: minutes })}>{minutes} min</button>)}
          <button aria-pressed={customDuration} onClick={event => { event.currentTarget.focus(); setPanel('duration') }}>{customDuration ? settings.totalMinutes + ' min' : 'Custom'}</button>
        </div>
        <p className="duration-help">Includes all selected audio and gongs</p>
      </section>
      <section className="setting-row">
        <div className="setting-line">
          <label htmlFor="instructions">Instructions</label>
          <div className="plain-select select-wrap">
            <select id="instructions" value={settings.enableInstructions ? 'play' : 'skip'} onChange={event => onChange({ enableInstructions: event.target.value === 'play' })}>
              <option value="skip">Skip</option><option value="play">Play</option>
            </select><Icon name="down" size={16} />
          </div>
        </div>
        <p className="supporting">{settings.enableInstructions ? 'Guidance before silent practice' : 'Silent practice without instructions'}</p>
      </section>
      <button className="setting-row audio-summary" onClick={event => { event.currentTarget.focus(); setPanel('audio') }} aria-haspopup="dialog">
        <span className="setting-line"><span>Audio & gongs</span><span className="trailing-action">Customize <Icon name="down" size={16} /></span></span>
        <span className="supporting">{audioSummary(settings)}<br />Mettā {settings.enableMetta ? 'on' : 'off'}</span>
      </button>
    </> : <>
      <section className="duration-section guided-options" aria-labelledby="guided-label">
        <h2 id="guided-label">Guided Vipassana</h2>
        <p className="supporting">A complete sitting with S. N. Goenka.</p>
        <div className="guided-instructions"><label htmlFor="guided-instructions">Instructions</label>
          <div className="select-wrap">
            <select id="guided-instructions" value={settings.instructionType} onChange={event => onChange({ instructionType: event.target.value === 'long' ? 'long' : 'short' })}>
              <option value="short">Short instructions</option><option value="long">Long instructions</option>
            </select><Icon name="down" size={16} />
          </div>
        </div>
        <PlaySelect label="Opening gong" enabled={settings.enableGong} onChange={enableGong => onChange({ enableGong })} />
        <p className="supporting">The full recording plays without a time limit.</p>
      </section>
    </>}
    {!result.ok && <p role="alert" className="validation-message">{result.message}</p>}
    <div className="setup-footer">
      <div className="finish-preview">
        <div><span>{isCustom ? 'Finish at' : 'Estimated finish'}</span><time>{plan ? formatFinish(now + plan.totalSeconds * 1000, now) : '—'}</time></div>
        <p>If you start now · {formatClock(now)}</p>
      </div>
      <button className="details-button" disabled={!plan} onClick={event => { event.currentTarget.focus(); setPanel('details') }}>View session details <Icon name="info" size={17} /></button>
      <button className="primary-button start-button" disabled={!plan} onClick={event => { event.currentTarget.focus(); if (plan) onStart(plan) }}>
        <span>Start session</span><span>{plan ? formatDuration(plan.totalSeconds) : settings.totalMinutes + ' min'}</span>
      </button>
    </div>
    {panel === 'audio' && <AudioSettings {...props} onClose={() => setPanel(null)} />}
    {panel === 'duration' && <DurationPicker {...props} onClose={() => setPanel(null)} />}
    {panel === 'details' && plan && <Dialog title={isCustom ? 'Your ' + settings.totalMinutes + ' minutes' : 'Your guided sitting'} onClose={() => setPanel(null)}>
      <dl className="session-details">{plan.steps.map(step => <div key={step.id}><dt>{step.type === 'timer' ? 'Silent practice' : step.label}</dt><dd>{formatCountdown(step.durationSeconds)}</dd></div>)}</dl>
      <div className="details-total"><span>Total duration</span><span>{formatCountdown(plan.totalSeconds)}</span></div>
      <p className="supporting">{isCustom ? 'All audio fits inside this duration. Playing more audio leaves less silent practice.' : 'The finish time is an estimate. Your full recording will play.'}</p>
      <button className="primary-button" onClick={() => setPanel(null)}>Done</button>
    </Dialog>}
  </main>
}
