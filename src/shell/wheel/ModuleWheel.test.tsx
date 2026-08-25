import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../routes/routes";
import { ModuleWheel } from "./ModuleWheel";
import { WheelProvider } from "./WheelContext";

/**
 * `shell/wheel/` (2026-08-11, promoted-to-global pass). `ModuleWheel` used
 * to be tested through `Canvas.test.tsx` (it was a Home grid item); it now
 * lives here, as a standalone unit, since it no longer has anything to do
 * with Home specifically. `useTurn` is mocked — same precedent as
 * `NavItem.test.tsx` — because the turn machine itself is covered
 * end-to-end elsewhere (`TurnProvider.test.tsx`); this file proves
 * `ModuleWheel` wires the right controls and, critically, the three
 * contracts that changed in this pass:
 *   · EVERY COMMIT IS EXPLICIT — no auto-navigate on settle, on any
 *     breakpoint (the old desktop-only 450ms debounce is gone).
 *   · CLOSES ON ROUTE CHANGE — driven by `location.pathname`, not by
 *     patching every call site that might navigate.
 *   · the global trigger has no onboarding copy and isn't
 *     `sessionStorage`-backed.
 *
 * `animejs/draggable` is mocked (sdd/animejs-wheel-trigger-drag) — jsdom
 * has no `DOMPoint`, which the real `Draggable`'s `Transforms` class
 * needs unconditionally, so every test here would throw on mount without
 * this (`.wheel-trigger` renders in every closed-state test, and
 * `useWheelTriggerDrag` now runs unconditionally while it does). Real
 * drag geometry belongs to `e2e/wheel-trigger-drag.spec.ts` instead —
 * click-vs-drag disambiguation is meaningless against a mock.
 */
const goMock = vi.hoisted(() => vi.fn());
const createDraggableMock = vi.hoisted(() =>
  vi.fn(() => ({
    setX: vi.fn(),
    setY: vi.fn(),
    refresh: vi.fn(),
    revert: vi.fn(),
    disable: vi.fn(),
  })),
);

vi.mock("../../turn/useTurn", () => ({
  useTurn: () => ({ go: goMock }),
}));

vi.mock("animejs/draggable", () => ({
  createDraggable: createDraggableMock,
}));
vi.mock("animejs", () => ({
  cubicBezier: vi.fn(() => "mock-ease"),
}));

function RouteChanger({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" data-testid="change-route" onClick={() => navigate(to)}>
      change route
    </button>
  );
}

function renderWheel(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <WheelProvider>
        <RouteChanger to="/projects" />
        <ModuleWheel modules={ROUTES} />
      </WheelProvider>
    </MemoryRouter>,
  );
}

function press(key: string) {
  act(() => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

const pressSpace = () => press(" ");
const pressEscape = () => press("Escape");

function wheel() {
  return screen.getByRole("listbox", { name: "Portfolio modules" });
}

function selectedLabel() {
  return within(wheel())
    .getAllByRole("option")
    .find((option) => option.getAttribute("aria-selected") === "true")?.textContent;
}

describe("ModuleWheel", () => {
  beforeEach(() => {
    goMock.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts closed, as a plain always-visible icon button with no onboarding copy", () => {
    renderWheel();

    const trigger = screen.getByRole("button", { name: "Open navigation" });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("type", "button");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    // No "Press Space"/"Tap to open" hint text left anywhere — the button
    // itself is the whole affordance now.
    expect(screen.queryByText(/press space/i)).not.toBeInTheDocument();
  });

  it("Space opens the wheel, and does not navigate doing it", () => {
    renderWheel();

    pressSpace();

    expect(wheel()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open navigation" })).not.toBeInTheDocument();
    expect(goMock).not.toHaveBeenCalled();
  });

  it("Tab-focusing the trigger then pressing Enter opens the wheel via native <button> activation, not the document-level Space shortcut", async () => {
    // Real timers for this one — user-event's internal delays don't play
    // well with the suite's fake timers (beforeEach above), and nothing
    // in this interaction depends on the turn/debounce timing they exist
    // to control.
    vi.useRealTimers();
    const user = userEvent.setup();
    renderWheel();

    const trigger = screen.getByRole("button", { name: "Open navigation" });
    // `renderWheel`'s own `RouteChanger` test button sits before the
    // trigger in tab order — tab past it to reach the real trigger.
    await user.tab();
    await user.tab();
    expect(trigger).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(wheel()).toBeInTheDocument();
    expect(goMock).not.toHaveBeenCalled();
  });

  it("clicking the trigger opens the wheel too", () => {
    renderWheel();

    act(() => {
      screen.getByRole("button", { name: "Open navigation" }).click();
    });

    expect(wheel()).toBeInTheDocument();
  });

  it("Escape closes the wheel back to the trigger", () => {
    renderWheel();

    pressSpace();
    expect(wheel()).toBeInTheDocument();

    pressEscape();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  });

  it("clicking the backdrop closes the wheel", () => {
    const { container } = renderWheel();
    pressSpace();

    act(() => {
      (container.querySelector(".wheel-backdrop") as HTMLElement).click();
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("lists every routed module", () => {
    renderWheel();
    pressSpace();

    for (const route of ROUTES) {
      expect(within(wheel()).getByRole("option", { name: route.short })).toBeInTheDocument();
    }
    expect(within(wheel()).getAllByRole("option")).toHaveLength(ROUTES.length);
  });

  it("Space advances the selection once open, without navigating", () => {
    renderWheel();
    pressSpace();

    expect(selectedLabel()).toBe(ROUTES[0].short);
    expect(goMock).not.toHaveBeenCalled();

    pressSpace();
    expect(selectedLabel()).toBe(ROUTES[1].short);
    expect(goMock).not.toHaveBeenCalled();
  });

  it("EVERY COMMIT IS EXPLICIT: selecting an option and merely waiting never navigates", () => {
    renderWheel();
    pressSpace();
    pressSpace(); // moves onto ROUTES[1]

    // The old desktop-only behavior auto-navigated ~450ms after the
    // selection settled. That's gone — advance well past it and confirm
    // nothing fired.
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(goMock).not.toHaveBeenCalled();
  });

  it("Enter commits the selected module, handing the wheel to go() as the opener", () => {
    renderWheel();
    pressSpace();

    const listbox = wheel();
    act(() => {
      listbox.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });

    expect(goMock).toHaveBeenCalledTimes(1);
    expect(goMock).toHaveBeenCalledWith(ROUTES[0].path, listbox);
  });

  it("clicking an unselected option selects it; clicking the selected one commits it", () => {
    renderWheel();
    pressSpace();

    const projects = within(wheel()).getByRole("option", { name: ROUTES[2].short });

    act(() => {
      projects.click();
    });
    expect(goMock).not.toHaveBeenCalled();
    expect(selectedLabel()).toBe(ROUTES[2].short);

    act(() => {
      projects.click();
    });
    expect(goMock).toHaveBeenCalledWith(ROUTES[2].path, wheel());
  });

  it("keeps data-page on the wheel in sync with the selection", () => {
    renderWheel();
    pressSpace();

    expect(wheel()).toHaveAttribute("data-page", ROUTES[0].pageId);
    pressSpace();
    expect(wheel()).toHaveAttribute("data-page", ROUTES[1].pageId);
  });

  it("CLOSES ON ROUTE CHANGE: closes whenever the route changes, not only via its own activate()", () => {
    renderWheel();
    pressSpace();
    expect(wheel()).toBeInTheDocument();

    // A route change from anywhere else (browser back/forward, another
    // control) — not driven through this component's own `go()` call.
    act(() => {
      screen.getByTestId("change-route").click();
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  });

  it("announces the current selection through a live region while open", () => {
    renderWheel();
    pressSpace();

    expect(screen.getByRole("status")).toHaveTextContent(
      `${ROUTES[0].title}, module 1 of ${ROUTES.length}`,
    );
  });
});
