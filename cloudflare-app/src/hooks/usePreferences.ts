import { useEffect, useState } from 'react'
import { defaultPreferences, preferencesCookie, readPreferences } from '../lib/preferences'
import type { Preferences } from '../lib/preferences'

/** React owns committed choices; the cookie is a best-effort persistence adapter. */
export function usePreferences() {
  const [preferences, setPreferences] = useState(() => {
    const theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    try { return readPreferences(document.cookie, theme) } catch { return defaultPreferences(theme) }
  })
  useEffect(() => {
    try { document.cookie = preferencesCookie(preferences, location.protocol === 'https:') }
    catch { /* Blocked storage must not prevent starting a session. */ }
  }, [preferences])
  const updatePreferences = (patch: Partial<Preferences>) => {
    setPreferences(previous => ({ ...previous, ...patch, version: 1 }))
  }
  return { preferences, updatePreferences }
}
