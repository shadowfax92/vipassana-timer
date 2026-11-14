import type { PhaseDefinition } from './types'

export const vipassanaGuidedPhase: PhaseDefinition = {
  label: 'Vipassana (guided)',
  type: 'audio',
  resolve: () => ({
    enabled: true,
    audioSrc: '/audio/guided/vipassana-guided-60min.mp4',
  }),
}
