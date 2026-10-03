import type { SessionConfig } from '../types'

export type Theme = 'light' | 'dark'
import { MAX_MINUTES, MIN_MINUTES } from './sessionPlan'

export const PREFERENCES_COOKIE = 'daily_vipassana_preferences'
/** One versioned record owns setup, theme and reminder consent on this browser. */
export interface Preferences extends Omit<SessionConfig, 'meditationMinutes' | 'introDuration' | 'outroDuration'> {
  totalMinutes: number
  introDuration: 'default' | 'none'
  outroDuration: 'default' | 'none'
  version: 1
  theme: Theme
  hideStartReminder: boolean
}
export function defaultPreferences(theme: Theme = 'dark'): Preferences {
  return {
    version: 1, mode: 'custom', totalMinutes: 60,
    enableGong: true, enableInstructions: true, enableMetta: false,
    customInstructionType: 'vipassana',
    introDuration: 'default', outroDuration: 'default', instructionType: 'short',
    theme, hideStartReminder: false,
  }
}
/** Cookie contents are untrusted and may outlive the code that wrote them. */
export function readPreferences(cookie: string, theme: Theme = 'dark'): Preferences {
  const defaults = defaultPreferences(theme)
  try {
    const entry = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(PREFERENCES_COOKIE + '='))
    if (!entry) return defaults
    const value: unknown = JSON.parse(decodeURIComponent(entry.slice(PREFERENCES_COOKIE.length + 1)))
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) return defaults
    const record = value as Record<string, unknown>
    return {
      ...defaults,
      mode: record.mode === 'guided' ? 'guided' : defaults.mode,
      totalMinutes: typeof record.totalMinutes === 'number' && Number.isInteger(record.totalMinutes)
        && record.totalMinutes >= MIN_MINUTES && record.totalMinutes <= MAX_MINUTES ? record.totalMinutes : defaults.totalMinutes,
      enableGong: typeof record.enableGong === 'boolean' ? record.enableGong : defaults.enableGong,
      enableInstructions: typeof record.enableInstructions === 'boolean' ? record.enableInstructions : defaults.enableInstructions,
      // Older cookies only stored Play/Skip. Keep that choice and use the
      // existing Vipassana recording when no custom recording was saved.
      customInstructionType: record.customInstructionType === 'anapana' ? 'anapana' : 'vipassana',
      enableMetta: typeof record.enableMetta === 'boolean' ? record.enableMetta : defaults.enableMetta,
      introDuration: record.introDuration === 'none' ? 'none' : 'default',
      outroDuration: record.outroDuration === 'none' ? 'none' : 'default',
      instructionType: record.instructionType === 'long' ? 'long' : 'short',
      theme: record.theme === 'light' || record.theme === 'dark' ? record.theme : theme,
      hideStartReminder: record.hideStartReminder === true,
    }
  } catch { return defaults }
}
export function preferencesCookie(preferences: Preferences, secure: boolean): string {
  return `${PREFERENCES_COOKIE}=${encodeURIComponent(JSON.stringify(preferences))}; Path=/; Max-Age=31536000; SameSite=Lax${secure ? '; Secure' : ''}`
}
