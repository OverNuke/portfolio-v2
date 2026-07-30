import type { Skill } from "../../content/types";

export interface SkillBadgeProps {
  skill: Skill;
}

/**
 * One chip in a doc 12 "Badge field" — the icon is `aria-hidden`, since the
 * skill name sits right next to it as visible text; giving the icon its
 * own accessible name would just announce the same thing twice.
 */
export function SkillBadge({ skill }: SkillBadgeProps) {
  const Icon = skill.icon;

  return (
    <li className="badge">
      {Icon && <Icon aria-hidden="true" />}
      <span className="badge__name">{skill.name}</span>
    </li>
  );
}
