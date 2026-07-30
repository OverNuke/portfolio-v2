import type { Project } from "./types";

export type ProjectCategory = "Backend" | "Mobile" | "Module" | "Frontend" | "Project";

const CATEGORY_RULES: Array<{ tags: readonly string[]; category: ProjectCategory }> = [
  { tags: ["flutter", "dart", "swift", "kotlin", "react native"], category: "Mobile" },
  { tags: ["odoo"], category: "Module" },
  {
    tags: ["express", "django", "flask", "fastapi", "node.js", "mysql", "postgresql", "postgres", "docker"],
    category: "Backend",
  },
  { tags: ["next.js", "react", "vue", "svelte", "tailwind", "shaders", "typescript"], category: "Frontend" },
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
