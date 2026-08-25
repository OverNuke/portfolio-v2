import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TIER_MAX, tierForWidth } from "./viewportTier";

const FIELD_CSS = join(__dirname, "..", "components", "project-field", "project-field.css");

describe("tierForWidth", () => {
  it("puts the boundaries on the tier they belong to", () => {
    // Both numbers are `max-width`, so the boundary pixel itself is inside
    // the narrower tier — the same reading the CSS gives it.
    expect(tierForWidth(TIER_MAX.phone)).toBe("phone");
    expect(tierForWidth(TIER_MAX.phone + 1)).toBe("tablet");
    expect(tierForWidth(TIER_MAX.tablet)).toBe("tablet");
    expect(tierForWidth(TIER_MAX.tablet + 1)).toBe("pc");
  });

  it("resolves the tiers a real device lands in", () => {
    expect(tierForWidth(390)).toBe("phone"); // iPhone
    expect(tierForWidth(820)).toBe("phone"); // iPad portrait — poster stack
    expect(tierForWidth(1024)).toBe("tablet"); // iPad landscape
    expect(tierForWidth(1440)).toBe("pc");
  });
});

describe("the tiers agree with the stylesheet that draws them", () => {
  /**
   * `viewportTier.ts` and `project-field.css` each state the same two
   * numbers, and there is no way to make one import the other. This is the
   * seam, so it is guarded: move a breakpoint in either file without the
   * other and the reform animates across a line the composition does not
   * actually change at.
   */
  it("names the same two breakpoints", () => {
    const css = readFileSync(FIELD_CSS, "utf-8").replace(/\s+/g, " ");

    expect(css).toContain(`(max-width: ${TIER_MAX.phone}px)`);
    expect(css).toContain(
      `(max-width: ${TIER_MAX.tablet}px) and (min-width: ${TIER_MAX.phone + 1}px)`,
    );
  });
});
