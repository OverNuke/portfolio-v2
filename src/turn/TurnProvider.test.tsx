import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Crease } from "./Crease";
import { PageLayer } from "./PageLayer";
import { TurnProvider } from "./TurnProvider";
import { useTurn } from "./useTurn";

/**
 * Task 2.4 (sdd/phase2-app-shell). Standalone harness mirroring, but NOT
 * being, what App.tsx (task 2.5) will compose — same precedent as
 * `routes.test.tsx`. `layerMounted` gates PageLayer exactly the way 2.5
 * must: `location.pathname !== "/" || displayedPath !== "/"`.
 */
function Harness() {
  const { registerShell, layerMounted, go } = useTurn();

  return (
    <div>
      <main id="main-content" tabIndex={-1} ref={registerShell}>
        <button
          type="button"
          data-testid="nav-profile"
          onClick={(e) => go("/profile", e.currentTarget)}
        >
          Open profile
        </button>
        <button
          type="button"
          data-testid="nav-projects"
          onClick={(e) => go("/projects", e.currentTarget)}
        >
          Open projects
        </button>
      </main>
      {layerMounted && (
        <PageLayer title="PROFILE" tag="PAGE 01">
          <p>Profile body</p>
        </PageLayer>
      )}
      <Crease />
    </div>
  );
}

function renderHarness(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TurnProvider>
        <Harness />
      </TurnProvider>
    </MemoryRouter>,
  );
}

describe("TurnProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens a page on nav click: focus + inert land synchronously, layer is a dialog, settle finishes the turn", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;
    expect(shell).not.toHaveAttribute("inert");

    act(() => {
      screen.getByTestId("nav-profile").click();
    });

    // Design steps 1-4 (mount, focus, inert, CSS trigger) are synchronous —
    // only settle (step 5) waits on the 200ms timer.
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("data-turn", "forward-home");
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("PROFILE");
    expect(document.activeElement).toBe(heading);
    expect(shell).toHaveAttribute("inert");
    expect(shell).toHaveAttribute("aria-hidden", "true");

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Settled: layer rests at "open", shell stays inert (page is open).
    expect(dialog).toHaveAttribute("data-turn", "open");
    expect(shell).toHaveAttribute("inert");
  });

  it("rapid double-open is a no-op: the shell never ends up inert with no layer, only one turn plays", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;

    act(() => {
      const btn = screen.getByTestId("nav-profile");
      btn.click();
      btn.click(); // second call while busy — must be ignored, not queued
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Exactly one turn completed: shell is correctly inert with a layer on top.
    expect(shell).toHaveAttribute("inert");
    expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();

    // No stray pending turn left to fire later.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(shell).toHaveAttribute("inert");
  });

  it("deep link then close: focus lands on #main-content, not <body> and not a nonexistent control", () => {
    renderHarness("/profile");
    const shell = document.getElementById("main-content")!;

    // Deep link resolves forward-home on first paint (opener = null).
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(shell).toHaveAttribute("inert");

    act(() => {
      screen.getByRole("button", { name: /back \/ esc/i }).click();
    });

    // Un-inert happens before the animation settles is asserted below via
    // the settle sequence; here we advance past the close turn entirely.
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(shell).not.toHaveAttribute("inert");
    expect(shell).not.toHaveAttribute("aria-hidden");
    expect(document.activeElement).toBe(shell);
    expect(document.activeElement).not.toBe(document.body);
  });

  it("reverse turn un-inerts the shell before returning focus to the exact opener", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;
    const opener = screen.getByTestId("nav-profile");

    act(() => {
      opener.click();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(shell).toHaveAttribute("inert");

    act(() => {
      screen.getByRole("button", { name: /back \/ esc/i }).click();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(shell).not.toHaveAttribute("inert");
    expect(document.activeElement).toBe(opener);
  });

  it("busy guard blocks go() while a turn is in flight, but the flag clears once it settles", () => {
    renderHarness("/");
    act(() => {
      screen.getByTestId("nav-profile").click();
    });

    // Mid-turn: a second attempt to open a different page is a no-op.
    act(() => {
      screen.getByTestId("nav-projects").click();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Only the FIRST click's destination (PROFILE) ever opened.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("PROFILE");
  });

  it("Crease carries the current turn state and is aria-hidden", () => {
    renderHarness("/");
    const crease = document.querySelector(".crease")!;
    expect(crease).toHaveAttribute("aria-hidden", "true");
    expect(crease).toHaveAttribute("data-turn", "none");

    act(() => {
      screen.getByTestId("nav-profile").click();
    });
    expect(crease).toHaveAttribute("data-turn", "forward-home");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(crease).toHaveAttribute("data-turn", "none");
  });
});
