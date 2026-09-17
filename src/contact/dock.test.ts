import { describe, expect, it } from "vitest";
import { dockFalloff } from "./dock";

describe("dockFalloff (Gaussian proximity)", () => {
  it("peaks at 1 when the pointer is exactly on the card", () => {
    expect(dockFalloff(0, 0)).toBe(1);
  });

  it("is symmetric around the origin", () => {
    expect(dockFalloff(2, 0)).toBeCloseTo(dockFalloff(-2, 0), 10);
    expect(dockFalloff(0, 3)).toBeCloseTo(dockFalloff(0, -3), 10);
  });

  it("decays monotonically as distance grows", () => {
    const samples = [0, 0.5, 1, 1.5, 2, 3].map((d) => dockFalloff(d, 0));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeLessThan(samples[i - 1]);
    }
  });
});
