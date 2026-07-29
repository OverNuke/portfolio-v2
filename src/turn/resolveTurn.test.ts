import { describe, expect, it } from "vitest";
import { resolveTurn } from "./resolveTurn";

/**
 * Task 2.3 (sdd/phase2-app-shell): truth table from design's `resolveTurn`
 * spec — turn direction is a pure function of (displayedPath, nextPath).
 */
describe("resolveTurn", () => {
  it("returns 'none' when the destination matches the currently displayed path", () => {
    expect(resolveTurn("/profile", "/profile")).toBe("none");
    expect(resolveTurn("/", "/")).toBe("none");
  });

  it("returns 'reverse' when the destination is Home, from any displayed page", () => {
    expect(resolveTurn("/profile", "/")).toBe("reverse");
    expect(resolveTurn("/contact", "/")).toBe("reverse");
  });

  it("returns 'forward-home' when leaving Home for any other page", () => {
    expect(resolveTurn("/", "/profile")).toBe("forward-home");
    expect(resolveTurn("/", "/skills")).toBe("forward-home");
  });

  it("returns 'forward-page' when moving directly between two different pages", () => {
    expect(resolveTurn("/profile", "/projects")).toBe("forward-page");
    expect(resolveTurn("/skills", "/contact")).toBe("forward-page");
  });
});
