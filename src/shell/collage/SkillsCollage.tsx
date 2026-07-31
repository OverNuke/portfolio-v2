import { SKILLS } from "../../content/data";
import { SkillBadge } from "../../components/skill-badge/SkillBadge";
import { useCollageSeed } from "./useCollageSeed";
import type { SkillsSeedId } from "./collageSeeds";
import "./skills-collage.css";

export interface SkillsCollageProps {
  /** Unit-test only — production callers never pass this (real runtime randomness). */
  seedOverride?: SkillsSeedId;
}

/**
 * Home collage's Skills badge field. Unlike CertificateField, this picks
 * once per mount among 5 fully pre-authored, individually
 * docs/12_COLLAGE_SYSTEM.md-compliant layouts — see the 2026-07-31 dated
 * exception in that doc. `?collageSeed=<id>` overrides the pick for
 * scripts/audit.mjs and tests, via useCollageSeed.
 */
export function SkillsCollage({ seedOverride }: SkillsCollageProps) {
  const seed = useCollageSeed(seedOverride);

  return (
    <ul className={`skills-collage skills-collage--${seed}`} aria-label="Skills">
      {SKILLS.map((skill) => (
        <SkillBadge key={skill.name} skill={skill} />
      ))}
    </ul>
  );
}
