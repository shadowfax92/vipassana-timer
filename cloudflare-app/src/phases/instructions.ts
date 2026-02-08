import type { PhaseDefinition } from './types'

export const instructionsPhase: PhaseDefinition = {
  label: 'Instructions',
  type: 'audio',
  resolve: (config) => ({
    enabled: config.enableInstructions,
    audioSrc: '/audio/instructions.mp3',
  }),
}
