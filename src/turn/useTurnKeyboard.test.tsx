import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useSetWheelOpen, WheelProvider } from "../shell/wheel/WheelContext";
import { PageLayer } from "./PageLayer";
import { TurnProvider } from "./TurnProvider";
import { useTurn } from "./useTurn";
import { useTurnKeyboard } from "./useTurnKeyboard";

/**
 * Task 2.7 (sdd/phase2-app-shell). Real `TurnProvider` (not mocked) —
 * `useTurnKeyboard` is a thin document-level dispatcher onto `go()`; the
 * value of this test is proving it reaches the real turn machine correctly,
 * mirroring `TurnProvider.test.tsx`'s own harness style (plain `.click()`/
 * `fireEvent` inside `act()` + fake timers — user-event + fake timers hangs
 * without extra config, per that file's precedent).
 *
 * 2026-08-11: `useTurnKeyboard` now reads `useWheelOpen()` (the wheel takes
 * Escape/ArrowRight precedence while it's open — see the hook's own header),
 * so it throws without a `WheelProvider` ancestor. `renderHarness` wraps in
 * one; a `data-testid="open-wheel"` button flips the shared context value
 * without needing the real `ModuleWheel` (that integration is covered in
 * `App.test.tsx`, against the real composed app).
 */
function Harness() {
  useTurnKeyboard();
  const { registerShell, layerMounted, go } = useTurn();
  const setWheelOpen = useSetWheelOpen();

  return (
    <div>
      <main id="main-content" tabIndex={-1} ref={registerShell}>
        <button
          type="button"
          data-testid="nav-certifications"
          data-page="certifications"
          onClick={(e) => go("/certifications", e.currentTarget)}
        >
          Open certifications
        </button>
      </main>
      <button type="button" data-testid="open-wheel" onClick={() => setWheelOpen(true)}>
        Open wheel
      </button>
      {/* Deliberately OUTSIDE the shell: while a page is open the shell is
          `inert`, and jsdom does not enforce inert's real focus-blocking
          behavior (design D4 note — only the attribute is observable in
          jsdom). Keeping the input as a sibling avoids a test that only
          "passes" because jsdom lets you focus an inert subtree. */}
      <input data-testid="text-input" />
      {layerMounted && (
        <PageLayer title="CERTIFICATE ARCHIVE" tag="PAGE 01">
          <p>Certifications body</p>
        </PageLayer>
      )}
    </div>
  );
}

function renderHarness(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TurnProvider>
        <WheelProvider>
          <Harness />
        </WheelProvider>
      </TurnProvider>
    </MemoryRouter>,
  );
}

describe("useTurnKeyboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Escape closes an open page (same reverse-turn code path as the close control)", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;

    act(() => {
      screen.getByTestId("nav-certifications").click();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(shell).toHaveAttribute("inert");

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(shell).not.toHaveAttribute("inert");
  });

  it("ArrowRight closes an open page", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;

    act(() => {
      screen.getByTestId("nav-certifications").click();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(shell).toHaveAttribute("inert");

    act(() => {
      fireEvent.keyDown(document, { key: "ArrowRight" });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(shell).not.toHaveAttribute("inert");
  });

  it("ArrowLeft at Home opens the focused NavItem's page (reads data-page off document.activeElement)", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;
    const navButton = screen.getByTestId("nav-certifications") as HTMLButtonElement;

    act(() => {
      navButton.focus();
    });
    expect(document.activeElement).toBe(navButton);

    act(() => {
      fireEvent.keyDown(navButton, { key: "ArrowLeft" });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(shell).toHaveAttribute("inert");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("CERTIFICATE ARCHIVE");
  });

  it("ignores ArrowLeft when focus is inside a text input", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;
    const input = screen.getByTestId("text-input") as HTMLInputElement;

    act(() => {
      input.focus();
    });

    act(() => {
      fireEvent.keyDown(input, { key: "ArrowLeft" });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(shell).not.toHaveAttribute("inert");
    expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();
  });

  it("ignores ArrowLeft when a modifier key is held", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;
    const navButton = screen.getByTestId("nav-certifications") as HTMLButtonElement;

    act(() => {
      navButton.focus();
    });

    act(() => {
      fireEvent.keyDown(navButton, { key: "ArrowLeft", ctrlKey: true });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(shell).not.toHaveAttribute("inert");
  });

  it("defers Escape/ArrowRight to the wheel while it's open over an open page", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;

    act(() => {
      screen.getByTestId("nav-certifications").click();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(shell).toHaveAttribute("inert");

    act(() => {
      screen.getByTestId("open-wheel").click();
    });

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // The page must stay open — the wheel owns Escape while `wheelOpen` is
    // true; this hook stood down instead of closing the page underneath it.
    expect(shell).toHaveAttribute("inert");

    act(() => {
      fireEvent.keyDown(document, { key: "ArrowRight" });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(shell).toHaveAttribute("inert");
  });

  it("ignores Escape when focus is inside a text input while a page is open", () => {
    renderHarness("/");
    const shell = document.getElementById("main-content")!;
    const input = screen.getByTestId("text-input") as HTMLInputElement;

    act(() => {
      screen.getByTestId("nav-certifications").click();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(shell).toHaveAttribute("inert");

    act(() => {
      input.focus();
    });
    act(() => {
      fireEvent.keyDown(input, { key: "Escape" });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Page must remain open — the guard suppressed the close.
    expect(shell).toHaveAttribute("inert");
  });
});
