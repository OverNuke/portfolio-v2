import {
  SiDart,
  SiDocker,
  SiExpress,
  SiFirebase,
  SiFlutter,
  SiGooglemaps,
  SiJavascript,
  SiMysql,
  SiOdoo,
  SiPostgresql,
  SiPython,
  type IconType,
} from "@icons-pack/react-simple-icons";

import type { Project } from "./types";

export type ProjectCategory = "Backend" | "Mobile" | "Module" | "Frontend" | "Project";

/**
 * Brand mark per stack entry, for the poster tier's badge row
 * (`project-field.css`, 2026-08-14). Same package `data.ts` already uses
 * for `Skill.icon`, so the marks are consistent with Home's stack rail
 * rather than a second icon set.
 *
 * Keyed lowercase and looked up that way, because `Project.tags` is
 * free-form display text ("Google Maps API", "Node.js") authored for
 * reading, not for matching — the same reason `CATEGORY_RULES` above
 * lowercases before comparing.
 *
 * A tag with no entry here is not a bug and must not throw: simple-icons
 * has no mark for plenty of real technologies. `getTechIcon` returns
 * undefined and the badge falls back to a two-letter monogram.
 */
const TECH_ICONS: Record<string, IconType> = {
  dart: SiDart,
  docker: SiDocker,
  express: SiExpress,
  firebase: SiFirebase,
  flutter: SiFlutter,
  "google maps api": SiGooglemaps,
  javascript: SiJavascript,
  mysql: SiMysql,
  odoo: SiOdoo,
  postgresql: SiPostgresql,
  python: SiPython,
};

export function getTechIcon(tag: string): IconType | undefined {
  return TECH_ICONS[tag.trim().toLowerCase()];
}

const CATEGORY_RULES: Array<{ tags: readonly string[]; category: ProjectCategory }> = [
  { tags: ["flutter", "dart", "swift", "kotlin", "react native"], category: "Mobile" },
  { tags: ["odoo"], category: "Module" },
  {
    tags: [
      "express",
      "django",
      "flask",
      "fastapi",
      "node.js",
      "mysql",
      "postgresql",
      "postgres",
      "docker",
    ],
    category: "Backend",
  },
  {
    tags: ["next.js", "react", "vue", "svelte", "tailwind", "shaders", "typescript"],
    category: "Frontend",
  },
];

export function getProjectCategory(project: Project): ProjectCategory {
  const lower = project.tags.map((t) => t.toLowerCase());
  for (const rule of CATEGORY_RULES) {
    if (rule.tags.some((t) => lower.includes(t))) return rule.category;
  }
  return "Project";
}

export function getProjectStatus(project: Project): "Live" | "Private" {
  return project.repo && project.repo !== "#" ? "Live" : "Private";
}

/**
 * Text for the /projects disc chip (`sdd/projects-section-design-import`).
 * The authored `chip` when the record carries one, otherwise the derived
 * category lowercased to sit in the marker-hand voice. Kept here rather than
 * inlined in `FieldRecord` so it can be asserted without rendering — the
 * chip is decorative (`aria-hidden`), so this string never reaches the
 * accessibility tree and the category stays exposed via `.pf-record__kind`.
 */
export function resolveChipText(project: Project): string {
  return project.chip ?? getProjectCategory(project).toLowerCase();
}

export const STATUS_LABEL: Record<ReturnType<typeof getProjectStatus>, string> = {
  Live: "DEPLOYED",
  Private: "PRIVATE",
};

export function splitProjects(projects: readonly Project[]) {
  const featured = projects.find((p) => p.featured) ?? projects[0];
  const tiles = projects.filter((p) => p !== featured).slice(0, 3);
  return { featured, tiles };
}

/** `PROJECT_001`, derived from render position — never stored, so reordering can't leave a stale id. */
export function formatProjectId(index: number): string {
  return `PROJECT_${String(index + 1).padStart(3, "0")}`;
}
