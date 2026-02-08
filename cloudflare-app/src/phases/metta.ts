import type { PhaseDefinition } from './types'

export const mettaPhase: PhaseDefinition = {
  label: 'Metta',
  type: 'audio',
  resolve: (config) => ({
    enabled: config.enableMetta,
    audioSrc: '/audio/metta.mp3',
  }),
}
