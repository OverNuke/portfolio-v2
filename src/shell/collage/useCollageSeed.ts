import { useState } from "react";
import { pickWeightedSeed, SKILLS_SEEDS, type SkillsSeedId } from "./collageSeeds";

const SEED_QUERY_PARAM = "collageSeed";

function isSkillsSeedId(value: string | null): value is SkillsSeedId {
  return value !== null && (SKILLS_SEEDS as readonly string[]).includes(value);
}

/**
 * Resolution order: (1) an explicit override (unit tests), (2)
 * `?collageSeed=<id>` (what `scripts/audit.mjs` sets per navigation, since
 * the audit serves a single Vite build and can't rebuild per seed), (3) a
 * real weighted-random pick.
 */
function resolveSeed(overrideSeed?: SkillsSeedId): SkillsSeedId {
  if (overrideSeed) return overrideSeed;
  if (typeof window !== "undefined") {
    const queryParam = new URLSearchParams(window.location.search).get(SEED_QUERY_PARAM);
    if (isSkillsSeedId(queryParam)) return queryParam;
  }
  return pickWeightedSeed();
}

/** Decided once per mount via a lazy `useState` initializer, which runs exactly once on first render. */
export function useCollageSeed(overrideSeed?: SkillsSeedId): SkillsSeedId {
  const [seed] = useState(() => resolveSeed(overrideSeed));
  return seed;
}
