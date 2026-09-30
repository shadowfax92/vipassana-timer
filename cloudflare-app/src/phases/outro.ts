import type { PhaseDefinition } from './types'

export const outroPhase: PhaseDefinition = {
  label: 'Closing',
  type: 'audio',
  fadeInAudioSrc: '/audio/outro-fade-in.mp3',
  resolve: () => ({
    enabled: true,
    audioSrc: '/audio/outro.mp3',
  }),
}
