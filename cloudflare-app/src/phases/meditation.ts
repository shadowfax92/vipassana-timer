import type { PhaseDefinition } from './types'

export const meditationPhase: PhaseDefinition = {
  label: 'Meditation',
  type: 'timer',
  resolve: (config) => ({
    enabled: true,
    durationSeconds: config.meditationMinutes * 60,
  }),
}
