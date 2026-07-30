import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ProjectsPage } from "./ProjectsPage";
import { PROJECTS } from "../content/data";
import { ROUTES } from "./routes";

describe("ProjectsPage", () => {
  it("renders one ProjectCard per entry in PROJECTS", () => {
    const { container } = render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );
    for (const project of PROJECTS) {
      expect(screen.getByText(project.title)).toBeInTheDocument();
    }
    expect(container.querySelectorAll(".projects-page__grid > li")).toHaveLength(PROJECTS.length);
  });

  it("keeps the nav route's record count in sync with PROJECTS.length", () => {
    const projectsRoute = ROUTES.find((r) => r.pageId === "projects")!;
    expect(projectsRoute.count).toBe(String(PROJECTS.length));
    expect(projectsRoute.sub).toContain(String(PROJECTS.length));
  });
});
