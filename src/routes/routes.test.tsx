import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { CertificationsPage } from "./CertificationsPage";
import { ContactPage } from "./ContactPage";
import { NotFound } from "./NotFound";
import { ProjectsPage } from "./ProjectsPage";
import { ROUTES } from "./routes";
import { TurnProvider } from "../turn/TurnProvider";

/**
 * Task 2.1 (sdd/phase2-app-shell). This standalone route tree mirrors what
 * App.tsx will compose in task 2.5 (not built yet — Shell/Home routing
 * wiring is out of scope here). "/" renders `element={null}` here too,
 * matching design's real plan ("`/` is an index route with
 * element={null}" — Shell IS Home, built separately in 2.5): the point of
 * this task's acceptance is that "/" renders without throwing, not that it
 * has its own placeholder Panel.
 */
function TestRoutes() {
  return (
    <TurnProvider>
      <Routes>
        <Route path="/" element={null} />
        <Route path="/certifications" element={<CertificationsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TurnProvider>
  );
}

describe("routes", () => {
  it("renders '/' without throwing", () => {
    expect(() =>
      render(
        <MemoryRouter initialEntries={["/"]}>
          <TestRoutes />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });

  it.each(ROUTES.map((route) => [route.path, route.sub] as const))(
    "renders the placeholder Panel at %s",
    (path, sub) => {
      // Panel no longer carries `route.title`/`route.tag` (PageLayer, not
      // present in this standalone route tree, owns that heading now — see
      // the Panel/PageLayer dedup). `route.sub` still reaches Panel's
      // `metadata` slot on every page, so it's what proves routing renders
      // real per-route content here.
      render(
        <MemoryRouter initialEntries={[path]}>
          <TestRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByText(sub)).toBeInTheDocument();
    },
  );

  it("renders NotFound for an unknown path", () => {
    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <TestRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText("404")).toBeInTheDocument();
  });
});
