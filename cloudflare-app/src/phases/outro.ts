import type { PhaseDefinition } from './types'

export const outroPhase: PhaseDefinition = {
  label: 'Closing',
  type: 'audio',
  resolve: () => ({
    enabled: true,
    audioSrc: '/audio/outro.mp3',
  }),
}
