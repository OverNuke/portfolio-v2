/**
 * docs/12_COLLAGE_SYSTEM.md, 2026-07-31 exception: the Skills badge field
 * picks once per mount among 5 fully pre-authored, individually
 * doc-12-compliant layouts (`skills-collage.css`) — a discrete choice among
 * static CSS, not continuous/per-instance randomization. 4 common seeds
 * share 90% of the weight; the 5th is a 10% "easter egg".
 */
export const SKILLS_SEEDS = [
  "common-a",
  "common-b",
  "common-c",
  "common-d",
  "rare-easter-egg",
] as const;

export type SkillsSeedId = (typeof SKILLS_SEEDS)[number];

const COMMON_SEEDS = SKILLS_SEEDS.slice(0, -1) as readonly SkillsSeedId[];
const RARE_SEED: SkillsSeedId = "rare-easter-egg";
const RARE_SEED_PROBABILITY = 0.1;

export function pickWeightedSeed(rng: () => number = Math.random): SkillsSeedId {
  const roll = rng();
  if (roll >= 1 - RARE_SEED_PROBABILITY) {
    return RARE_SEED;
  }
  const commonWidth = (1 - RARE_SEED_PROBABILITY) / COMMON_SEEDS.length;
  const index = Math.min(COMMON_SEEDS.length - 1, Math.floor(roll / commonWidth));
  return COMMON_SEEDS[index];
}
