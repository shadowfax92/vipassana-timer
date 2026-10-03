import type { PhaseDefinition } from './types'
import { audioCatalog } from '../audioCatalog'

export const instructionsPhase: PhaseDefinition = {
  label: 'Instructions',
  type: 'audio',
  resolve: (config) => ({
    enabled: config.enableInstructions,
    label: config.customInstructionType === 'anapana' ? 'Anapana instructions' : 'Vipassana instructions',
    audioSrc: config.customInstructionType === 'anapana'
      ? audioCatalog.anapanaInstructions.audioSrc : audioCatalog.instructions.audioSrc,
  }),
}
