import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ABOUT_PROFILE } from "../content/data";
import { WheelProvider } from "./wheel/WheelContext";
import { TurnProvider } from "../turn/TurnProvider";
import { Shell } from "./Shell";

/**
 * Task 2.5 (sdd/phase2-app-shell). `Shell` = Home (design "There is no
 * routes/Home.tsx"): renders the Frame (StatusBar), owns
 * `<main id="main-content" tabIndex={-1}>`, and — critically for the
 * accessibility constraint — carries the identity (name/role) content
 * UNCONDITIONALLY. Everything painted on the collage canvas is
 * `aria-hidden`, so this is the only accessible carrier of that
 * information on Home (re-grounded `sdd/drop-intro-hero-placeholder`,
 * 2026-08-24, after `NameRevealIntro`'s removal). Wraps everything in
 * `.shell`, with
 * `registerShell` on the OUTER wrapper (not just `<main>`) so the Frame
 * chrome also goes `inert`/`aria-hidden` while a page is open — advisor
 * flagged this: attaching `registerShell` to `<main>` alone would leave
 * StatusBar outside the inert subtree.
 *
 * `SystemHeader` was removed 2026-08-10 (editorial-Home refinement pass) —
 * no functionality, branding relocated into `Canvas.tsx`'s `.hm-meta__end`.
 * The `.system-header` assertion below is kept as an explicit "retired, not
 * re-pinned" regression guard rather than deleted outright.
 *
 * 2026-08-11: the module wheel was promoted OUT of `Shell`'s subtree
 * entirely (`shell/wheel/`, mounted as a DOM sibling from `App.tsx`) so it
 * keeps working while `.shell` is `inert`. `Shell` no longer renders it, so
 * the wheel/gate/ArrowLeft-on-the-wheel assertions this file used to carry
 * moved to `App.test.tsx`, which composes the real thing. `useTurnKeyboard`
 * (called from `Shell`) now reads `useWheelOpen()`, so `renderShell` wraps
 * in a `WheelProvider` — without one the hook throws.
 */
function renderShell(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TurnProvider>
        <WheelProvider>
          <Shell />
        </WheelProvider>
      </TurnProvider>
    </MemoryRouter>,
  );
}

describe("Shell", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the accessible identity (name/role) inside #main-content", () => {
    renderShell();
    const main = document.getElementById("main-content")!;
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(
      screen.getByRole("heading", { name: "Kevin Sebastián Frías García" }),
    ).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PROFILE.role)).toBeInTheDocument();
  });

  it("puts registerShell on the OUTER wrapper, not just <main> — Frame chrome goes inert too", () => {
    renderShell();
    const shellEl = document.querySelector(".shell")!;
    expect(shellEl).not.toHaveAttribute("inert");
    expect(shellEl.contains(document.getElementById("main-content"))).toBe(true);
    expect(shellEl.querySelector(".system-header")).not.toBeInTheDocument();
    expect(shellEl.querySelector(".status-bar")).toBeInTheDocument();
  });

  it("goes inert when a page turn opens (deep-link path, no wheel involved)", () => {
    renderShell("/profile");
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const shellEl = document.querySelector(".shell")!;
    expect(shellEl).toHaveAttribute("inert");
    expect(shellEl).toHaveAttribute("aria-hidden", "true");
  });
});
