import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ProjectsPage } from "./ProjectsPage";
import { PROJECTS } from "../content/data";
import { ROUTES } from "./routes";
import { RECORDS_PER_FIELD } from "../components/project-field/fieldLayout";

function renderPage(initialEntry = "/projects") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ProjectsPage />
    </MemoryRouter>,
  );
}

describe("ProjectsPage", () => {
  it("renders one record per entry in PROJECTS", () => {
    const { container } = renderPage();
    for (const project of PROJECTS) {
      expect(screen.getByRole("heading", { name: project.title })).toBeInTheDocument();
    }
    expect(container.querySelectorAll(".pf-record")).toHaveLength(PROJECTS.length);
  });

  it("keeps the nav route's record count in sync with PROJECTS.length", () => {
    const projectsRoute = ROUTES.find((r) => r.pageId === "projects")!;
    expect(projectsRoute.count).toBe(String(PROJECTS.length));
    expect(projectsRoute.sub).toContain(String(PROJECTS.length));
  });

  it("fits the whole archive on one field at the current record count", () => {
    expect(PROJECTS.length).toBeLessThanOrEqual(RECORDS_PER_FIELD);
    renderPage();
    expect(screen.getByText("01 / 01")).toBeInTheDocument();
  });

  it("recovers from an out-of-range ?sheet deep link instead of rendering nothing", () => {
    // The query param keeps its original name so links made against the
    // panel sheet still resolve after the redesign.
    renderPage("/projects?sheet=97");
    for (const project of PROJECTS) {
      expect(screen.getByRole("heading", { name: project.title })).toBeInTheDocument();
    }
  });

  it("does not swallow ArrowRight when there is no previous field to go back to", async () => {
    // The shell owns Right = close (docs/05_ACCESSIBILITY.MD). The field
    // hook only claims it when it can actually page backwards, so on a
    // single-field archive the key must reach the document listener
    // untouched. If this fails, Right has stopped closing the page.
    const user = userEvent.setup();
    let reachedDocument = false;
    const spy = () => {
      reachedDocument = true;
    };
    document.addEventListener("keydown", spy);

    renderPage();
    await user.keyboard("{ArrowRight}");
    document.removeEventListener("keydown", spy);

    expect(reachedDocument).toBe(true);
  });
});
