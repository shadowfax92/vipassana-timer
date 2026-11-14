// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { defaultPreferences, preferencesCookie } from '../src/lib/preferences'

vi.hoisted(() => { URL.createObjectURL = () => 'blob:test-silent-audio' })

const recordingPath = '/audio/guided/vipassana-guided-60min.m4a'
let root: Root
let container: HTMLDivElement
let played: Set<HTMLMediaElement>
let failPlay: ((audio: HTMLMediaElement) => Promise<void> | undefined) | undefined

function button(name: string) {
  const result = [...container.querySelectorAll('button')].find(item => item.textContent?.trim() === name)
  if (!result) throw Error('Missing button: ' + name)
  return result
}
async function click(name: string) { await act(async () => button(name).click()) }
async function select(id: string, value: string) {
  const element = container.querySelector<HTMLSelectElement>('#' + id)
  if (!element) throw Error('Missing select: ' + id)
  await act(async () => {
    element.value = value
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
}
function recording() {
  const audio = [...played].find(item => item.getAttribute('src') === recordingPath)
  if (!audio) throw Error('Full recording was not played')
  return audio
}
async function start() {
  const startButton = [...container.querySelectorAll('button')].find(item => item.textContent?.startsWith('Start session'))
  if (!startButton) throw Error('Missing Start session')
  await act(async () => startButton.click())
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: {
    request: async () => Object.assign(new EventTarget(), { release: async () => {} }),
  } })
  played = new Set()
  failPlay = undefined
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
    played.add(this)
    Object.defineProperty(this, 'paused', { configurable: true, value: false })
    return failPlay?.(this) ?? Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
    Object.defineProperty(this, 'paused', { configurable: true, value: true })
  })
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(function () {
    this.currentTime = 0
    Object.defineProperty(this, 'duration', { configurable: true, value: 3766.336 })
    this.dispatchEvent(new Event('loadedmetadata'))
  })
  document.cookie = preferencesCookie({ ...defaultPreferences(), mode: 'vipassana-guided',
    totalMinutes: 40, hideStartReminder: true }, false)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<App />))
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('continuous guided playback', () => {
  it('tests that only nominal 60 minutes is offered and switching back keeps Custom and old Guided', async () => {
    expect(container.textContent).toContain('60 minutes only')
    expect(container.querySelector('.duration-presets')).toBeNull()
    expect(container.querySelector('#guided-instructions')?.textContent).toContain('Short instructions')
    expect(container.querySelector('#guided-instructions')?.textContent).toContain('Long instructions')
    await click('Custom')
    expect(button('40 min').getAttribute('aria-pressed')).toBe('true')
    await click('Guided')
    await select('guided-instructions', 'long')
    await start()
    expect([...played].some(audio => audio.getAttribute('src') === '/audio/gong.mp3')).toBe(true)
    await click('Skip recording')
    expect([...played].some(audio => audio.getAttribute('src') === '/audio/guided/long.mp3')).toBe(true)
  })

  it('tests that pause and resume preserve position and completion waits for the actual audio end', async () => {
    await start()
    const audio = recording()
    await act(async () => { audio.currentTime = 3601; audio.dispatchEvent(new Event('timeupdate')) })
    expect(container.querySelector('.phase-indicator')?.textContent).toBe('Vipassana (guided)')
    await click('Pause')
    expect(audio.paused).toBe(true)
    expect(container.textContent).toContain('Paused')
    await click('Resume')
    expect(audio.paused).toBe(false)
    expect(audio.currentTime).toBe(3601)
    await act(async () => audio.dispatchEvent(new Event('ended')))
    expect(container.textContent).toContain('Session complete')
    expect([...played].filter(item => item.getAttribute('src')?.startsWith('/audio/'))).toHaveLength(1)
  })

  it('tests that reset restarts the same single recording and end returns to setup', async () => {
    await start()
    const audio = recording()
    await act(async () => { audio.currentTime = 120; audio.dispatchEvent(new Event('timeupdate')) })
    await click('Pause')
    await click('Reset recording')
    expect(recording().currentTime).toBe(0)
    expect(recording().paused).toBe(false)
    await click('End session')
    expect(audio.paused).toBe(true)
    expect(container.textContent).toContain('60 minutes only')
  })

  it('tests that a recording error offers retry without playing a gong', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await start()
    await act(async () => recording().dispatchEvent(new Event('error')))
    expect(container.textContent).toContain('Session interrupted')
    expect([...played].some(audio => audio.getAttribute('src') === '/audio/gong.mp3')).toBe(false)
    await click('Try again')
    expect(recording().paused).toBe(false)
    expect(container.textContent).not.toContain('Session interrupted')
  })

  it.each(['End session', 'Reset recording'])('tests that stale play rejection after %s cannot interrupt the next playback', async action => {
    let rejectPlay: (error: Error) => void = () => { throw Error('Playback was not pending') }
    let pending = true
    failPlay = audio => {
      if (audio.getAttribute('src') !== recordingPath || !pending) return
      pending = false
      return new Promise<void>((_resolve, reject) => { rejectPlay = reject })
    }
    await start()
    await click(action)
    if (action === 'End session') await start()
    await act(async () => rejectPlay(new DOMException('The play request was interrupted', 'AbortError')))
    expect(container.querySelector('.phase-indicator')?.textContent).toBe('Vipassana (guided)')
    expect(recording().paused).toBe(false)
    expect(container.textContent).not.toContain('Session interrupted')
  })

  it('tests that pausing pending playback ignores its AbortError and can resume', async () => {
    let rejectPlay: (error: Error) => void = () => { throw Error('Playback was not pending') }
    let pending = true
    failPlay = audio => {
      if (audio.getAttribute('src') !== recordingPath || !pending) return
      pending = false
      return new Promise<void>((_resolve, reject) => { rejectPlay = reject })
    }
    await start()
    await click('Pause')
    await act(async () => rejectPlay(new DOMException('Interrupted by pause', 'AbortError')))
    expect(container.textContent).not.toContain('Session interrupted')
    await click('Resume')
    expect(recording().paused).toBe(false)
  })
})
