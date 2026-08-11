import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteConfig } from "../../routes/routes";
import { NavItem } from "./NavItem";

/**
 * Task 2.6 (sdd/phase2-app-shell). `useTurn` is mocked here (not a real
 * `TurnProvider`) — NavItem's own contract is "render as a real <button>
 * and call `go(path, opener)` correctly"; the turn machine itself (busy
 * guard, focus management, settle timing) is already covered end-to-end by
 * `src/turn/TurnProvider.test.tsx`. Mocking keeps this a true unit test of
 * NavItem and avoids re-testing TurnProvider internals here.
 */
const goMock = vi.hoisted(() => vi.fn());

vi.mock("../../turn/useTurn", () => ({
  useTurn: () => ({ go: goMock }),
}));

const route: RouteConfig = {
  path: "/profile",
  pageId: "profile",
  title: "PROFILE",
  tag: "PAGE 01",
  index: "01",
  sub: "identity / experience",
  count: "RDY",
  short: "PROFILE",
  // Added to RouteConfig 2026-08-10 for Home's caption rail. NavItem does
  // not render it — the field is here only to satisfy the type.
  lede: "Identity, experience, and the way the work actually gets made.",
};

describe("NavItem", () => {
  beforeEach(() => {
    goMock.mockClear();
  });

  it("renders as a real <button> carrying index/label/sub/count and data-page", () => {
    render(<NavItem route={route} />);

    const button = screen.getByRole("button", { name: /profile/i });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("data-page", "profile");
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("identity / experience")).toBeInTheDocument();
    expect(screen.getByText("RDY")).toBeInTheDocument();
  });

  it("activates on Space — proves native <button> semantics, would fail as an anchor — and calls go with the route path + itself as opener", async () => {
    const user = userEvent.setup();
    render(<NavItem route={route} />);
    const button = screen.getByRole("button", { name: /profile/i });

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard(" ");

    expect(goMock).toHaveBeenCalledTimes(1);
    expect(goMock).toHaveBeenCalledWith("/profile", button);
  });

  it("click also calls go with the route path + itself as opener", async () => {
    const user = userEvent.setup();
    render(<NavItem route={route} />);
    const button = screen.getByRole("button", { name: /profile/i });

    await user.click(button);

    expect(goMock).toHaveBeenCalledTimes(1);
    expect(goMock).toHaveBeenCalledWith("/profile", button);
  });
});
