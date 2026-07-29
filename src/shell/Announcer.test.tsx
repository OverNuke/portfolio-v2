import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Announcer } from "./Announcer";
import { TurnProvider } from "../turn/TurnProvider";
import { useTurn } from "../turn/useTurn";

/**
 * Task 2.5 (sdd/phase2-app-shell), design "DOM sibling order & z bands":
 * Announcer must be a visually-hidden `role="status" aria-live="polite"`
 * region reading `useTurn().announcement` — and per design, a DOM SIBLING
 * of the shell, never a descendant (or aria-hidden on the inert shell would
 * swallow it). This test only proves the announcement text renders and the
 * live-region contract; sibling placement is asserted in App's own tests
 * (App.tsx is what actually composes DOM order).
 */
function OpenButton() {
  const { go } = useTurn();
  return (
    <button type="button" onClick={(e) => go("/profile", e.currentTarget)}>
      open
    </button>
  );
}

function Harness() {
  return (
    <>
      <OpenButton />
      <Announcer />
    </>
  );
}

describe("Announcer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders an empty, visually-hidden live region before any turn", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <TurnProvider>
          <Harness />
        </TurnProvider>
      </MemoryRouter>,
    );
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("");
    expect(region).toHaveClass("visually-hidden");
  });

  it("announces the destination module once a turn settles", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <TurnProvider>
          <Harness />
        </TurnProvider>
      </MemoryRouter>,
    );

    act(() => {
      screen.getByRole("button", { name: "open" }).click();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole("status")).toHaveTextContent(/profile module opened/i);
  });
});
