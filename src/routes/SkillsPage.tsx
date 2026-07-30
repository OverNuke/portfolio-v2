import { Panel } from "../components/panel/Panel";
import { SkillBadge } from "../components/skill-badge/SkillBadge";
import { SKILLS } from "../content/data";
import type { Skill } from "../content/types";
import { ROUTES } from "./routes";
import "./skills-page.css";

const route = ROUTES.find((r) => r.pageId === "skills")!;

const CATEGORY_LABEL: Record<Skill["category"], string> = {
  language: "Languages",
  framework: "Frameworks",
  tool: "Tools",
};

const CATEGORY_ORDER: Skill["category"][] = ["language", "framework", "tool"];

export function SkillsPage() {
  return (
    <Panel
      title={route.title}
      status={route.tag}
      metadata={<span>{route.sub}</span>}
      content={
        <div className="skills-page">
          {CATEGORY_ORDER.map((category) => {
            const skills = SKILLS.filter((skill) => skill.category === category);
            if (skills.length === 0) return null;

            return (
              <section key={category} className="skills-page__group">
                <h3 className="bar skills-page__group-label">
                  <span className="v">{CATEGORY_LABEL[category]}</span>
                </h3>
                <ul className="badge-field">
                  {skills.map((skill) => (
                    <SkillBadge key={skill.name} skill={skill} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      }
    />
  );
}
