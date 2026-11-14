import { describe, expect, it } from 'vitest'
import { defaultPreferences, preferencesCookie, readPreferences, PREFERENCES_COOKIE } from '../src/lib/preferences'

describe('browser preferences', () => {
  it('round trips every saved choice in one cookie', () => {
    const saved = { ...defaultPreferences('light'), totalMinutes: 45, enableMetta: true,
      hideStartReminder: true, enableGong: false, enableInstructions: false,
      customInstructionType: 'anapana' as const, introDuration: 'none' as const }
    const cookie = preferencesCookie(saved, true)
    expect(readPreferences('other=1; ' + cookie)).toEqual(saved)
    expect(cookie).toContain('SameSite=Lax; Secure')
    expect(cookie).toContain('Max-Age=31536000')
    expect(cookie.length).toBeLessThan(4096)
    expect(preferencesCookie(saved, false)).not.toContain('Secure')
  })
  it.each([true, false])('preserves legacy Play/Skip: %s', enableInstructions => {
    const cookie = PREFERENCES_COOKIE + '=' + encodeURIComponent(JSON.stringify({ version: 1, enableInstructions }))
    expect(readPreferences(cookie)).toEqual({ ...defaultPreferences(), enableInstructions, customInstructionType: 'vipassana' })
  })
  it('recovers an unknown custom recording without resetting other choices', () => {
    const cookie = PREFERENCES_COOKIE + '=' + encodeURIComponent(JSON.stringify({
      version: 1, customInstructionType: 'unknown', enableInstructions: false, instructionType: 'long',
    }))
    expect(readPreferences(cookie)).toEqual({
      ...defaultPreferences(), customInstructionType: 'vipassana', enableInstructions: false, instructionType: 'long',
    })
  })
  it.each(['', PREFERENCES_COOKIE + '=%', PREFERENCES_COOKIE + '=null',
    PREFERENCES_COOKIE + '=' + encodeURIComponent(JSON.stringify({ version: 2, hideStartReminder: true }))])('recovers from missing/corrupt/future preferences', cookie => {
    expect(readPreferences(cookie, 'light')).toEqual(defaultPreferences('light'))
  })
  it('validates fields individually and never trusts truthy consent', () => {
    const cookie = PREFERENCES_COOKIE + '=' + encodeURIComponent(JSON.stringify({
      version: 1, totalMinutes: -5, theme: 'pink', hideStartReminder: 'true', enableGong: false, introDuration: '2min',
    }))
    expect(readPreferences(cookie)).toEqual({ ...defaultPreferences(), enableGong: false })
  })
})
