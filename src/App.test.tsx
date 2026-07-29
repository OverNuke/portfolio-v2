import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { ROUTES } from "./routes/routes";

/**
 * Task 2.5 (sdd/phase2-app-shell). `App` composes `TurnProvider` + `Shell`
 * (=Home) + `PageLayer` (gated on `layerMounted`) + `Announcer`, plus
 * `NameRevealIntro` gated per D6 (mounted only when the INITIAL location is
 * "/", decided once). `App` itself stays Router-agnostic (design file
 * layout: `main.tsx` owns `<BrowserRouter>`) — every test here supplies its
 * own `MemoryRouter`, same precedent as `TurnProvider.test.tsx`/
 * `Shell.test.tsx`.
 */
function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // NameRevealIntro persists "intro:played" in sessionStorage on dismiss —
    // jsdom's sessionStorage survives across tests in this file, which would
    // turn "intro mounts at /" into a false negative for every test after
    // the first one that dismisses it.
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the accessible name/role content on Home, outside the decorative intro", () => {
    renderApp("/");

    expect(
      screen.getByRole("heading", { name: "Kevin Sebastián Frías García" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Full-Stack Developer")).toBeInTheDocument();
  });

  it("mounts NameRevealIntro when the initial location is '/' (D6)", () => {
    renderApp("/");
    expect(screen.getByText(/tap to skip/i)).toBeInTheDocument();
  });

  it.each(ROUTES.map((route) => [route.path, route.title, route.tag] as const))(
    "renders the placeholder Panel for %s inside the composed app, and does NOT mount the intro (D6)",
    (path, title, tag) => {
      renderApp(path);

      // D6: initial location isn't "/", so the intro must not mount.
      expect(screen.queryByText(/tap to skip/i)).not.toBeInTheDocument();

      // The identity content still structurally exists in the Shell (D6's
      // safety requirement — the host must independently carry name/role)
      // even though the deep-link forward-home turn makes it `inert`
      // synchronously in the same commit; query with `hidden: true` since
      // `aria-hidden` excludes it from the default a11y-tree query.
      expect(
        screen.getByRole("heading", { name: "Kevin Sebastián Frías García", hidden: true }),
      ).toBeInTheDocument();

      // A deep link resolves forward-home on first paint (resolveTurn,
      // displayedPath seeded to "/") — advance past the synchronous
      // open steps' settle timer to reach the resting "open" state.
      act(() => {
        vi.advanceTimersByTime(200);
      });

      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
      // Panel primitive rendered end-to-end inside the real composed app
      // (not just routes.test.tsx's standalone harness) — its status slot
      // shows the route's tag. PageLayer's own `.page-tag` chrome also
      // duplicates this text, so at least one match (not exactly one) is
      // the correct assertion here.
      expect(within(dialog).getAllByText(tag).length).toBeGreaterThanOrEqual(1);
    },
  );

  it("renders NotFound (as PageLayer content, demoted to h2) for an unknown path", () => {
    renderApp("/does-not-exist");

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("404")).toBeInTheDocument();
  });

  it("deep link then Escape: closes back to Home and focuses #main-content", () => {
    renderApp("/skills");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    const shell = document.querySelector(".shell")!;
    expect(shell).toHaveAttribute("inert");

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(shell).not.toHaveAttribute("inert");
    expect(document.activeElement).toBe(document.getElementById("main-content"));
  });
});
