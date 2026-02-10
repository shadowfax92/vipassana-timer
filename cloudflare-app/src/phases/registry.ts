import { gongPhase } from './gong'
import { introPhase } from './intro'
import { instructionsPhase } from './instructions'
import { meditationPhase } from './meditation'
import { mettaPhase } from './metta'
import { outroChantingPhase } from './outro-chanting'
import { outroPhase } from './outro'
import { guidedPhase } from './guided'
import type { PhaseDefinition } from './types'
import type { SessionConfig, SessionStep, Metadata } from '../types'

const PHASE_REGISTRY: Record<string, PhaseDefinition> = {
  gong: gongPhase,
  intro: introPhase,
  instructions: instructionsPhase,
  meditation: meditationPhase,
  metta: mettaPhase,
  outro_chanting: outroChantingPhase,
  outro: outroPhase,
  guided: guidedPhase,
}

const CUSTOM_FLOW = ['gong', 'intro', 'instructions', 'meditation', 'outro_chanting', 'metta', 'outro'] as const
const GUIDED_FLOW = ['gong', 'guided'] as const

export function resolveSessionSteps(config: SessionConfig, metadata: Metadata): SessionStep[] {
  const flow = config.mode === 'guided' ? GUIDED_FLOW : CUSTOM_FLOW

  return flow
    .map(id => {
      const { resolve, ...definition } = PHASE_REGISTRY[id]
      const resolved = resolve(config, metadata)
      return { id, ...definition, ...resolved }
    })
    .filter(step => step.enabled)
}
