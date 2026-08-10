import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ProjectsPage } from "./ProjectsPage";
import { PROJECTS } from "../content/data";
import { ROUTES } from "./routes";
import { RECORDS_PER_SHEET } from "../components/project-sheet/sheetLayout";

function renderPage(initialEntry = "/projects") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ProjectsPage />
    </MemoryRouter>,
  );
}

describe("ProjectsPage", () => {
  it("renders one panel per entry in PROJECTS", () => {
    const { container } = renderPage();
    for (const project of PROJECTS) {
      expect(screen.getByRole("heading", { name: project.title })).toBeInTheDocument();
    }
    // Panels = records + the colophon, which is not a record.
    expect(container.querySelectorAll(".sheet-panel")).toHaveLength(PROJECTS.length + 1);
  });

  it("keeps the nav route's record count in sync with PROJECTS.length", () => {
    const projectsRoute = ROUTES.find((r) => r.pageId === "projects")!;
    expect(projectsRoute.count).toBe(String(PROJECTS.length));
    expect(projectsRoute.sub).toContain(String(PROJECTS.length));
  });

  it("fits the whole archive on one sheet at the current record count", () => {
    expect(PROJECTS.length).toBeLessThanOrEqual(RECORDS_PER_SHEET);
    renderPage();
    expect(screen.getByText("01 / 01")).toBeInTheDocument();
  });

  it("recovers from an out-of-range ?sheet deep link instead of rendering nothing", () => {
    renderPage("/projects?sheet=97");
    // Clamped back onto the only sheet there is; every record still prints.
    for (const project of PROJECTS) {
      expect(screen.getByRole("heading", { name: project.title })).toBeInTheDocument();
    }
  });

  it("does not swallow ArrowRight when there is no previous sheet to go back to", async () => {
    // The shell owns Right = close (docs/05_ACCESSIBILITY.MD). The sheet
    // hook only claims it when it can actually page backwards, so on a
    // single-sheet archive the key must reach the document listener
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
