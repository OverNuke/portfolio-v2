import { describe, expect, it } from "vitest";
import { dockScale } from "./dockHover";

describe("dockScale", () => {
  it("returns maxScale at zero distance", () => {
    expect(dockScale(0, 240, 1.07)).toBeCloseTo(1.07);
  });

  it("returns 1 once distance reaches the radius", () => {
    expect(dockScale(240, 240, 1.07)).toBe(1);
  });

  it("returns 1 beyond the radius", () => {
    expect(dockScale(500, 240, 1.07)).toBe(1);
  });

  it("stays within [1, maxScale] at the midpoint", () => {
    const mid = dockScale(120, 240, 1.07);
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(1.07);
  });

  it("decreases monotonically as distance grows", () => {
    const samples = [0, 40, 80, 120, 160, 200, 240].map((d) => dockScale(d, 240, 1.07));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeLessThanOrEqual(samples[i - 1]);
    }
  });

  it("returns exactly 1 when maxScale is 1, regardless of distance", () => {
    expect(dockScale(0, 240, 1)).toBe(1);
  });
});
