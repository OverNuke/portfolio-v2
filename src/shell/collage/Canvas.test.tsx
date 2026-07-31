import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../routes/routes";
import { Canvas } from "./Canvas";

/**
 * Task 3.1 (sdd/phase2-app-shell). Regression check against 2.6/2.7's
 * existing behavior now that NavItem is composed inside the 12x12 collage
 * grid instead of a plain ungrided list (batch 5). `useTurn` is mocked —
 * same rationale as `NavItem.test.tsx`: the turn machine itself is
 * covered end-to-end elsewhere (`TurnProvider.test.tsx`), this file only
 * needs to prove Canvas composes NavItem/ROUTES correctly.
 */
const goMock = vi.hoisted(() => vi.fn());

vi.mock("../../turn/useTurn", () => ({
  useTurn: () => ({ go: goMock }),
}));

describe("Canvas", () => {
  beforeEach(() => {
    goMock.mockClear();
  });

  it("renders the identity content", () => {
    render(<Canvas />);
    expect(
      screen.getByRole("heading", { name: "Kevin Sebastián Frías García" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Full-Stack Developer")).toBeInTheDocument();
  });

  it("renders one real <button> NavItem per route, still reachable via the Primary nav landmark", () => {
    render(<Canvas />);
    const nav = screen.getByRole("navigation", { name: "Primary" });

    for (const route of ROUTES) {
      const button = screen.getByRole("button", { name: new RegExp(route.title, "i") });
      expect(nav).toContainElement(button);
    }
  });

  it("NavItems still activate correctly (click) now that they're inside the grid", async () => {
    const user = userEvent.setup();
    render(<Canvas />);
    const button = screen.getByRole("button", { name: /profile/i });

    await user.click(button);

    expect(goMock).toHaveBeenCalledTimes(1);
    expect(goMock).toHaveBeenCalledWith("/profile", button);
  });

  it("the placeholder spec-cascade plate carries no real content and is aria-hidden", () => {
    const { container } = render(<Canvas />);
    // getByText/queryByText are not accessibility-tree-aware (they match
    // raw DOM text regardless of aria-hidden), so the real assertion here
    // is on the attribute itself, not on query absence.
    const specCascade = container.querySelector(".spec-cascade");
    expect(specCascade).toHaveAttribute("aria-hidden", "true");
    // getByRole IS accessibility-tree-aware — only the 4 real nav <li>s
    // should be exposed as "listitem"s, not the placeholder plate's 3.
    expect(screen.queryAllByRole("listitem")).toHaveLength(ROUTES.length);
  });

  /**
   * Phase 4.2 (sdd/phase4-visual-design), design D5/D6. Each accent plate
   * now carries a k/v fact line AND a unique hype line, grouped as two
   * sibling block-level children so a screen reader announces them as
   * separate text blocks (spec `collage-accent-bars`, "Screen-Reader Line
   * Grouping"). Neither line may be aria-hidden — both are sole-source
   * content, so this also proves neither got accidentally suppressed.
   */
  it("the status accent plate exposes its fact line and a distinct hype line as separate blocks, neither hidden", () => {
    const { container } = render(<Canvas />);
    const plate = container.querySelector(".bar--status");
    expect(plate).not.toBeNull();
    expect(plate).not.toHaveAttribute("aria-hidden");
    expect(plate?.tagName).toBe("DIV"); // two <p> siblings inside a <p> is invalid HTML (D5)

    const spec = plate?.querySelector(".bar__spec");
    const hype = plate?.querySelector(".bar__hype");
    expect(spec?.tagName).toBe("P");
    expect(hype?.tagName).toBe("P");
    expect(spec).not.toBe(hype); // distinct sibling nodes, not one merged run

    expect(screen.getByText("open to work")).toBeInTheDocument();
    expect(screen.getByText("Built to ship")).toBeInTheDocument();
  });

  it("the build accent plate exposes its own distinct fact line and hype line, neither hidden", () => {
    const { container } = render(<Canvas />);
    const plate = container.querySelector(".bar--build");
    expect(plate).not.toBeNull();
    expect(plate).not.toHaveAttribute("aria-hidden");
    expect(plate?.tagName).toBe("DIV");

    const spec = plate?.querySelector(".bar__spec");
    const hype = plate?.querySelector(".bar__hype");
    expect(spec?.tagName).toBe("P");
    expect(hype?.tagName).toBe("P");
    expect(spec).not.toBe(hype);

    expect(screen.getByText("phase_04 // 2026")).toBeInTheDocument();
    expect(screen.getByText("No rounded corners")).toBeInTheDocument();
  });
});
