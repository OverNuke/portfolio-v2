import { describe, expect, it } from "vitest";
import { dampStep, isSettled } from "./damping";

describe("dampStep", () => {
  it("moves toward the target without ever overshooting it", () => {
    let value = 0;
    for (let i = 0; i < 200; i++) {
      value = dampStep(value, 1, 1 / 60, 0.05);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(value).toBeGreaterThan(0.99);
  });

  it("is frame-rate independent: one big step matches many small ones", () => {
    const tau = 0.05;
    const total = 0.2;

    let coarse = 0;
    coarse = dampStep(coarse, 1, total, tau);

    let fine = 0;
    const steps = 20;
    for (let i = 0; i < steps; i++) fine = dampStep(fine, 1, total / steps, tau);

    expect(fine).toBeCloseTo(coarse, 3);
  });

  it("does nothing when already at the target", () => {
    expect(dampStep(1, 1, 1 / 60, 0.05)).toBe(1);
  });

  it("never divides by zero for a zero or negative tau", () => {
    expect(() => dampStep(0, 1, 1 / 60, 0)).not.toThrow();
    expect(Number.isFinite(dampStep(0, 1, 1 / 60, 0))).toBe(true);
  });
});

describe("isSettled", () => {
  it("matches OptionWheel's 0.001 threshold", () => {
    expect(isSettled(0.9995, 1)).toBe(true);
    expect(isSettled(0.99, 1)).toBe(false);
  });
});
