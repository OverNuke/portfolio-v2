import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { ABOUT_PROFILE } from "./content/data";
import { ROUTES } from "./routes/routes";

/**
 * Task 2.5 (sdd/phase2-app-shell). `App` composes `TurnProvider` + `Shell`
 * (=Home) + `PageLayer` (gated on `layerMounted`) + `Announcer`. `App`
 * itself stays Router-agnostic (design file layout: `main.tsx` owns
 * `<BrowserRouter>`) — every test here supplies its own `MemoryRouter`,
 * same precedent as `TurnProvider.test.tsx`/`Shell.test.tsx`.
 *
 * `NameRevealIntro` (previously mounted once at "/" per design D6) was
 * removed `sdd/drop-intro-hero-placeholder` (2026-08-24) — Home now renders
 * content on first paint with no gating overlay. The identity assertions
 * below survive that removal unchanged, since they were always pinning
 * Home's own accessible markup (Fence A), never the intro itself.
 *
 * `animejs/draggable` is mocked (sdd/animejs-wheel-trigger-drag), same
 * reasoning as `shell/wheel/ModuleWheel.test.tsx` — `App` renders the real
 * `ModuleWheel`, whose closed-state trigger now calls
 * `useWheelTriggerDrag` unconditionally, and jsdom has no `DOMPoint`
 * (which the real `Draggable` needs).
 */
vi.mock("animejs/draggable", () => ({
  createDraggable: vi.fn(() => ({
    setX: vi.fn(),
    setY: vi.fn(),
    refresh: vi.fn(),
    revert: vi.fn(),
    disable: vi.fn(),
  })),
}));
vi.mock("animejs", () => ({
  cubicBezier: vi.fn(() => "mock-ease"),
}));

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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the accessible name/role content on Home", () => {
    renderApp("/");

    expect(
      screen.getByRole("heading", { name: "Kevin Sebastián Frías García" }),
    ).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PROFILE.role)).toBeInTheDocument();
  });

  it.each(ROUTES.map((route) => [route.path, route.title, route.tag] as const))(
    "renders the placeholder Panel for %s inside the composed app, with identity content still structurally present",
    (path, title, tag) => {
      renderApp(path);

      // The identity content still structurally exists in the Shell (the
      // accessibility requirement Home's identity carriers must satisfy
      // unconditionally, independent of any intro — see
      // sdd/drop-intro-hero-placeholder) even though the deep-link
      // forward-home turn makes it `inert` synchronously in the same
      // commit; query with `hidden: true` since `aria-hidden` excludes it
      // from the default a11y-tree query. Scoped to `.shell` because
      // `/profile`'s own hero also carries the full name as a section
      // heading — a page heading, not Home's masthead.
      const shell = document.querySelector<HTMLElement>(".shell")!;
      expect(
        within(shell).getByRole("heading", {
          name: "Kevin Sebastián Frías García",
          hidden: true,
        }),
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
      // (not just routes.test.tsx's standalone harness) — it no longer
      // repeats the route's title/tag (Panel's title prop is omitted at
      // every call site now that PageLayer's `.page-tag` chrome is the
      // sole owner of this text), so exactly one match is the correct
      // assertion here.
      expect(within(dialog).getByText(tag)).toBeInTheDocument();
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
    renderApp("/profile");

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

  /**
   * 2026-08-11, promoted-to-global pass. The module wheel used to be a
   * Home grid item, nested inside `.shell` — it went `inert` along with
   * everything else in `.shell` the instant a page opened, so it could
   * never be reopened FROM a routed page. It is now a `position: fixed`
   * sibling of `Shell`/`PageLayer`, mounted from `AppShell` itself. These
   * tests exercise the composition no single unit test can: the wheel
   * staying interactive over an open page, Escape's topmost-layer-first
   * precedence, and a real navigation through it closing it on arrival.
   */
  describe("the global module wheel", () => {
    function openWheel() {
      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }),
        );
      });
    }

    it("stays interactive on a routed page — not caught by .shell going inert", () => {
      renderApp("/profile");
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(document.querySelector(".shell")).toHaveAttribute("inert");

      openWheel();

      expect(screen.getByRole("listbox", { name: "Portfolio modules" })).toBeInTheDocument();
    });

    it("Escape closes the wheel first when it's open over an already-open page; a second Escape then closes the page", () => {
      renderApp("/profile");
      act(() => {
        vi.advanceTimersByTime(200);
      });
      const shell = document.querySelector(".shell")!;
      expect(shell).toHaveAttribute("inert");

      openWheel();
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });
      // The wheel closed; the page underneath is untouched.
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(shell).toHaveAttribute("inert");

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(shell).not.toHaveAttribute("inert");
    });

    it("selecting a module from an already-open page navigates directly, and the wheel closes on arrival", () => {
      renderApp("/profile");
      act(() => {
        vi.advanceTimersByTime(200);
      });

      openWheel();
      const projectsIndex = ROUTES.findIndex((route) => route.path === "/projects");
      for (let i = 0; i < projectsIndex; i++) openWheel(); // Space advances while open

      // Enter is handled by the wheel's own focused listbox, not at the
      // document level — a keyboard-driven open already moved focus there.
      const listbox = screen.getByRole("listbox");
      act(() => {
        listbox.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
        );
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByRole("heading", { level: 1, name: ROUTES[projectsIndex].title }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
    });

    it("ArrowLeft at Home on the focused wheel opens its selected page", () => {
      renderApp("/");
      openWheel();
      const listbox = screen.getByRole("listbox", { name: "Portfolio modules" });
      expect(listbox).toHaveAttribute("data-page", ROUTES[0].pageId);
      listbox.focus();

      act(() => {
        listbox.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }),
        );
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(document.querySelector(".shell")).toHaveAttribute("inert");
      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByRole("heading", { level: 1, name: ROUTES[0].title }),
      ).toBeInTheDocument();
    });
  });
});
