import type { PhaseDefinition } from './types'

export const mettaPhase: PhaseDefinition = {
  label: 'Metta',
  type: 'audio',
  fadeInAudioSrc: '/audio/metta-fade-in.mp3',
  resolve: (config) => ({
    enabled: config.enableMetta,
    audioSrc: '/audio/metta.mp3',
  }),
}
