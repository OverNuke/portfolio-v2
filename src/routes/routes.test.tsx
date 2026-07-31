import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { ContactPage } from "./ContactPage";
import { NotFound } from "./NotFound";
import { ProfilePage } from "./ProfilePage";
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
        <Route path="/profile" element={<ProfilePage />} />
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

  it.each(ROUTES.map((route) => [route.path, route.title] as const))(
    "renders the placeholder Panel at %s",
    (path, title) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <TestRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByText(title)).toBeInTheDocument();
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
