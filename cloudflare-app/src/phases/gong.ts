import type { PhaseDefinition } from './types'

export const gongPhase: PhaseDefinition = {
  label: 'Starting Gong',
  type: 'audio',
  resolve: (config) => ({
    enabled: config.enableGong,
    audioSrc: '/audio/gong.mp3',
  }),
}
