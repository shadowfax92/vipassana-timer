import { selectChantingWithRetry } from "../utils/chanting";
import type { PhaseDefinition, ResolvedPhase } from "./types";
import type { SessionConfig, Metadata } from "../types";

function resolveIntro(
  config: SessionConfig,
  metadata: Metadata,
): ResolvedPhase {
  if (config.introDuration === "none") {
    return { enabled: false };
  }

  const file = selectChantingWithRetry(metadata, config.introDuration);
  if (!file) {
    return { enabled: false };
  }

  return {
    enabled: true,
    audioSrc: `/audio/chanting/${file}`,
  };
}

export const introPhase: PhaseDefinition = {
  label: "Intro Chanting",
  type: "audio",
  fadeInSeconds: 15,
  resolve: resolveIntro,
};
