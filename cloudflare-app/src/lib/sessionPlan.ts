import { audioCatalog } from '../audioCatalog'
import { resolveSessionSteps } from '../phases/registry'
import type { SessionStep, SessionMode, Metadata } from '../types'
import type { Preferences } from './preferences'

// The setup only offers fixed recordings. Legacy random chanting needs a
// metadata catalogue, but none of those paths can be selected by Preferences.
const metadata: Metadata = { chanting: { '2min': [], '5min': [] }, outro: 'outro.mp3', gong: 'gong.mp3' }

export const MIN_MINUTES = 1
export const MAX_MINUTES = 180
export const MIN_PRACTICE_SECONDS = 60
export type PlannedStep = SessionStep & { durationSeconds: number }

/** A setup preview and handoff to the existing player, not a playback clock. */
export interface SessionPlan {
  mode: SessionMode
  steps: PlannedStep[]
  totalSeconds: number
}
export type PlanResult = { ok: true; plan: SessionPlan } | { ok: false; message: string }

/**
 * Adapts the total selected in the UI to the player's existing silent-minutes
 * input. The phase registry still owns ordering, sources and fades. Audio plays
 * in full; buffering and Skip retain the player's existing timing behavior.
 */
export function buildSessionPlan(settings: Preferences): PlanResult {
  const steps = resolveSessionSteps({ ...settings, meditationMinutes: 0 }, metadata)
  const measured: PlannedStep[] = []
  for (const step of steps) {
    const durationSeconds = step.type === 'timer' ? 0
      : Object.values(audioCatalog).find(audio => audio.audioSrc === step.audioSrc)?.durationSeconds
    if (durationSeconds === undefined) {
      return { ok: false, message: 'The recording duration is unavailable. Please reload and try again.' }
    }
    measured.push({ ...step, durationSeconds })
  }
  const audioSeconds = sumDuration(measured)
  if (settings.mode === 'guided') {
    return { ok: true, plan: { mode: 'guided', steps: measured, totalSeconds: audioSeconds } }
  }
  if (!Number.isInteger(settings.totalMinutes) || settings.totalMinutes < MIN_MINUTES || settings.totalMinutes > MAX_MINUTES) {
    return { ok: false, message: 'Choose a whole number from 1 to 180 minutes.' }
  }
  const totalSeconds = settings.totalMinutes * 60
  const minimum = Math.ceil((audioSeconds + MIN_PRACTICE_SECONDS) / 60)
  if (totalSeconds - audioSeconds < MIN_PRACTICE_SECONDS) {
    return { ok: false, message: `Choose at least ${minimum} minutes, or skip some recordings to leave time for silent practice.` }
  }
  const planned = measured.map(step => step.type === 'timer'
    ? { ...step, durationSeconds: totalSeconds - audioSeconds } : step)
  return { ok: true, plan: { mode: 'custom', steps: planned, totalSeconds } }
}

export function sumDuration(steps: readonly PlannedStep[]): number {
  return steps.reduce((sum, step) => sum + step.durationSeconds, 0)
}
