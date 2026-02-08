import type { PhaseDefinition } from './types'

export const guidedPhase: PhaseDefinition = {
  label: 'Guided Session',
  type: 'audio',
  resolve: (config) => ({
    enabled: true,
    audioSrc: config.instructionType === 'short'
      ? '/audio/guided/short.mp3'
      : '/audio/guided/long.mp3',
  }),
}
