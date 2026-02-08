export interface ChantingFile {
  file: string;
  duration: number;
}

export interface Metadata {
  chanting: {
    "2min": ChantingFile[];
    "5min": ChantingFile[];
  };
  guided?: {
    short: string;
    long: string;
  };
  outro: string;
  gong: string;
}

export type SessionMode = "custom" | "guided";
export type ChantingDuration = "2min" | "5min" | "default" | "none";
export type MeditationDuration = number;
export type InstructionType = "short" | "long";

export interface SessionConfig {
  mode: SessionMode;
  enableGong: boolean;
  enableInstructions: boolean;
  enableMetta: boolean;
  introDuration: ChantingDuration;
  outroDuration: ChantingDuration;
  meditationMinutes: number;
  instructionType: InstructionType;
}

export interface SessionStep {
  id: string;
  label: string;
  type: "audio" | "timer";
  audioSrc?: string;
  durationSeconds?: number;
  fadeInSeconds?: number;
}

export type SessionStatus = "idle" | "active" | "complete" | "error";

export interface AudioProgress {
  current: number;
  duration: number;
}
