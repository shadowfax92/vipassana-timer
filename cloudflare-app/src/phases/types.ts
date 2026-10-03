import type { SessionConfig, Metadata } from '../types'

export interface ResolvedPhase {
  enabled: boolean
  // A selected recording can name itself in both the preview and active player.
  label?: string
  audioSrc?: string
  durationSeconds?: number
  fadeInSeconds?: number
}

export interface PhaseDefinition {
  label: string
  type: 'audio' | 'timer'
  fadeInSeconds?: number
  fadeInAudioSrc?: string
  resolve: (config: SessionConfig, metadata: Metadata) => ResolvedPhase
}
