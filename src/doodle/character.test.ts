import { describe, expect, it } from "vitest";
import { blink, boil, aimArm, buildArrow } from "./character";

describe("blink", () => {
  it("is fully open (1) outside the blink window", () => {
    expect(blink(1)).toBe(1);
  });

  it("dips below 1 inside the blink window", () => {
    // p = (t + 0.7) % 3.9 must land in [0, 0.17) — t=3.25 -> p=0.05
    expect(blink(3.25)).toBeLessThan(1);
  });

  it("never fully closes (floor at 0.08)", () => {
    for (let t = 3.2; t < 3.37; t += 0.01) {
      expect(blink(t)).toBeGreaterThanOrEqual(0.08);
    }
  });
});

describe("boil", () => {
  it("is deterministic for the same frame/seed", () => {
    const pts: Array<[number, number]> = [[0, 0], [1, 1]];
    const a = boil(pts, 10, 10, 3, 5, 2);
    const b = boil(pts, 10, 10, 3, 5, 2);
    expect(a).toEqual(b);
  });

  it("translates and scales around the given origin", () => {
    const pts: Array<[number, number]> = [[0, 0]];
    const [[x, y]] = boil(pts, 100, 100, 1, 0, 0, 2);
    expect(x).toBeCloseTo(100, 5);
    expect(y).toBeCloseTo(100, 5);
  });
});

describe("aimArm", () => {
  it("leaves the arm unchanged for a zero angle", () => {
    const arm: Array<[number, number]> = [[31, 2], [47, -5]];
    const out = aimArm(arm, 0, 31, 2);
    expect(out[0][0]).toBeCloseTo(31, 5);
    expect(out[0][1]).toBeCloseTo(2, 5);
  });

  it("rotates points around the pivot", () => {
    const arm: Array<[number, number]> = [[10, 0]];
    const out = aimArm(arm, Math.PI / 2, 0, 0);
    expect(out[0][0]).toBeCloseTo(0, 5);
    expect(out[0][1]).toBeCloseTo(10, 5);
  });
});

describe("buildArrow", () => {
  it("returns null below the growth threshold", () => {
    expect(buildArrow(0, 0, 100, 0, 0.02, 10, 0.1)).toBeNull();
  });

  it("grows a shaft from the hand toward the target", () => {
    const arrow = buildArrow(0, 0, 100, 0, 1, 10, 0.1);
    expect(arrow).not.toBeNull();
    expect(arrow!.shaft[0][0]).toBeCloseTo(0, 5);
    expect(arrow!.shaft.at(-1)![0]).toBeGreaterThan(50);
    expect(arrow!.barbA).toHaveLength(2);
    expect(arrow!.barbB).toHaveLength(2);
  });
});
