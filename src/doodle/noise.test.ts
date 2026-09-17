import { describe, expect, it } from "vitest";
import { rnd } from "./noise";

describe("rnd (doodle boil noise)", () => {
  it("is deterministic for identical (a,b,c)", () => {
    expect(rnd(3, 7, 12)).toBe(rnd(3, 7, 12));
  });

  it("stays within [-1, 1)", () => {
    for (let a = 0; a < 20; a++) {
      const v = rnd(a, a * 2, a + 1);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThan(1);
    }
  });

  it("varies across different seeds", () => {
    const values = new Set([rnd(0, 0, 0), rnd(1, 0, 0), rnd(0, 1, 0), rnd(0, 0, 1)]);
    expect(values.size).toBeGreaterThan(1);
  });
});
