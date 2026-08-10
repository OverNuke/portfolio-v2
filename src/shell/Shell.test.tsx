import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ABOUT_PROFILE } from "../content/data";
import { ROUTES } from "../routes/routes";
import { TurnProvider } from "../turn/TurnProvider";
import { Shell } from "./Shell";

/**
 * Task 2.5 (sdd/phase2-app-shell). `Shell` = Home (design "There is no
 * routes/Home.tsx"): renders the Frame (SystemHeader + StatusBar), owns
 * `<main id="main-content" tabIndex={-1}>`, and — critically for the
 * orchestrator's accessibility constraint — carries the identity
 * (name/role) content UNCONDITIONALLY, regardless of whether
 * NameRevealIntro mounts (D6's whole point: the shell must independently
 * carry that information). Wraps everything in `.shell`, with
 * `registerShell` on the OUTER wrapper (not just `<main>`) so the Frame
 * chrome also goes `inert`/`aria-hidden` while a page is open — advisor
 * flagged this: attaching `registerShell` to `<main>` alone would leave
 * SystemHeader/StatusBar outside the inert subtree.
 */
function renderShell(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TurnProvider>
        <Shell />
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

  // Contact left the module index on 2026-08-06 (its channels live on Home
  // itself); the route is still reachable by deep link and from Profile's
  // status chip, which Canvas.test.tsx covers.
  it("renders the module index, with one row per routed module", () => {
    renderShell();

    for (const route of ROUTES.filter((r) => r.pageId !== "contact")) {
      expect(
        screen.getByRole("button", { name: new RegExp(route.title, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("puts registerShell on the OUTER wrapper, not just <main> — Frame chrome goes inert too", () => {
    renderShell();
    const shellEl = document.querySelector(".shell")!;
    expect(shellEl).not.toHaveAttribute("inert");
    expect(shellEl.contains(document.getElementById("main-content"))).toBe(true);
    expect(shellEl.querySelector(".system-header")).toBeInTheDocument();
    expect(shellEl.querySelector(".status-bar")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: /profile/i }).click();
    });

    expect(shellEl).toHaveAttribute("inert");
    expect(shellEl).toHaveAttribute("aria-hidden", "true");
  });

  it("wires ArrowLeft on a focused index row to opening its page", () => {
    renderShell();
    const profileButton = screen.getByRole("button", { name: /profile/i });
    profileButton.focus();

    act(() => {
      profileButton.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }),
      );
    });

    expect(document.querySelector(".shell")).toHaveAttribute("inert");
  });
});
