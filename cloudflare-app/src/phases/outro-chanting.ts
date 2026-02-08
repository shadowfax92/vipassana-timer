import { selectChantingWithRetry } from "../utils/chanting";
import type { PhaseDefinition, ResolvedPhase } from "./types";
import type { SessionConfig, Metadata } from "../types";

function resolveOutroChanting(
  config: SessionConfig,
  metadata: Metadata,
): ResolvedPhase {
  if (config.outroDuration === "none") {
    return { enabled: false };
  }

  if (config.outroDuration === "default") {
    return { enabled: true, audioSrc: "/audio/chanting/default-outro.mp3" };
  }

  const file = selectChantingWithRetry(metadata, config.outroDuration);
  if (!file) return { enabled: false };

  return {
    enabled: true,
    audioSrc: `/audio/chanting/${file}`,
  };
}

export const outroChantingPhase: PhaseDefinition = {
  label: "Outro Chanting",
  type: "audio",
  fadeInSeconds: 15,
  resolve: resolveOutroChanting,
};
