import type { SessionConfig, Metadata } from '../types'

export interface ResolvedPhase {
  enabled: boolean
  audioSrc?: string
  durationSeconds?: number
}

export interface PhaseDefinition {
  label: string
  type: 'audio' | 'timer'
  fadeInSeconds?: number
  resolve: (config: SessionConfig, metadata: Metadata) => ResolvedPhase
}
