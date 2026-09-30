import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { audioCatalog } from '../src/audioCatalog'
import { defaultPreferences } from '../src/lib/preferences'
import { buildSessionPlan, sumDuration } from '../src/lib/sessionPlan'
import { roundDurations } from '../src/lib/time'

describe('setup duration accounting', () => {
  it('keeps every audio selection inside 30 and 60 minutes', () => {
    // Exercise every selection, not just the default sitting.
    for (const totalMinutes of [30, 60]) for (let mask = 0; mask < 32; mask++) {
      const result = buildSessionPlan({ ...defaultPreferences(), totalMinutes,
        enableGong: Boolean(mask & 1), enableInstructions: Boolean(mask & 2),
        enableMetta: Boolean(mask & 4), introDuration: mask & 8 ? 'default' : 'none',
        outroDuration: mask & 16 ? 'default' : 'none' })
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.message)
      expect(sumDuration(result.plan.steps)).toBeCloseTo(totalMinutes * 60)
      expect(roundDurations(result.plan.steps.map(step => step.durationSeconds)).reduce((sum, seconds) => sum + seconds, 0)).toBe(totalMinutes * 60)
      expect(result.plan.steps.at(-1)?.id).toBe('outro')
      expect(result.plan.steps.find(step => step.type === 'timer')?.durationSeconds).toBeGreaterThan(60)
    }
  })
  it('preserves the existing phase order, recordings and fade settings', () => {
    const result = buildSessionPlan({ ...defaultPreferences(), enableMetta: true })
    if (!result.ok) throw new Error(result.message)
    expect(result.plan.steps.map(step => step.id)).toEqual(['gong', 'intro', 'instructions', 'meditation', 'outro_chanting', 'metta', 'outro'])
    expect(result.plan.steps.find(step => step.id === 'intro')?.fadeInSeconds).toBe(15)
    // The default ending recording already fades in; do not fade it twice.
    expect(result.plan.steps.find(step => step.id === 'outro_chanting')?.fadeInSeconds).toBe(0)
  })
  it.each([
    { chanting: true, metta: true, first: 'outro_chanting', src: '/audio/chanting/default-outro-fade-in.mp3' },
    { chanting: true, metta: false, first: 'outro_chanting', src: '/audio/chanting/default-outro-fade-in.mp3' },
    { chanting: false, metta: true, first: 'metta', src: '/audio/metta-fade-in.mp3' },
    { chanting: false, metta: false, first: 'outro', src: '/audio/outro-fade-in.mp3' },
  ])('tests that only the first voice after silence fades: $first, metta=$metta', ({ chanting, metta, first, src }) => {
    const result = buildSessionPlan({ ...defaultPreferences(),
      outroDuration: chanting ? 'default' : 'none', enableMetta: metta })
    if (!result.ok) throw new Error(result.message)
    const ending = result.plan.steps.slice(result.plan.steps.findIndex(step => step.type === 'timer') + 1)
    expect(ending[0]).toMatchObject({ id: first, audioSrc: src })
    for (const step of ending.slice(1)) {
      expect(step.audioSrc).toBe(step.id === 'metta' ? '/audio/metta.mp3' : '/audio/outro.mp3')
    }
  })
  it.each([0, 1, 11, 45.5, 181, NaN])('rejects an invalid or overcrowded duration: %s', totalMinutes => {
    expect(buildSessionPlan({ ...defaultPreferences(), totalMinutes }).ok).toBe(false)
  })
  it('accepts short sittings once there is room for closing and silent practice', () => {
    const settings = { ...defaultPreferences(), totalMinutes: 3, enableGong: false, enableInstructions: false,
      introDuration: 'none' as const, outroDuration: 'none' as const }
    expect(buildSessionPlan(settings).ok).toBe(true)
    expect(buildSessionPlan({ ...settings, totalMinutes: 2 }).ok).toBe(false)
  })
  it.each(['short', 'long'] as const)('keeps the complete guided %s recording', instructionType => {
    const result = buildSessionPlan({ ...defaultPreferences(), mode: 'guided', instructionType, totalMinutes: 1 })
    if (!result.ok) throw new Error(result.message)
    expect(result.plan.steps.map(step => step.id)).toEqual(['gong', 'guided'])
    const audio = instructionType === 'short' ? audioCatalog.guidedShort : audioCatalog.guidedLong
    expect(result.plan.totalSeconds).toBeCloseTo(audio.durationSeconds + audioCatalog.gong.durationSeconds)
  })
  it('measures the exact shipped recordings', () => {
    for (const audio of Object.values(audioCatalog)) {
      const file = readFileSync(new URL('../public' + audio.audioSrc, import.meta.url))
      expect(createHash('sha256').update(file).digest('hex')).toBe(audio.sha256)
    }
  })
})
