import { describe, expect, it } from "vitest";
import {
  PER_SHEET_LANDSCAPE,
  PER_SHEET_PORTRAIT,
  WALL_LANDSCAPE,
  WALL_PORTRAIT,
  assertCertLayouts,
} from "./certLayouts";

describe("certLayouts", () => {
  it("every authored layout is in-bounds, non-overlapping, and matches its ladder key", () => {
    expect(() => assertCertLayouts()).not.toThrow();
  });

  it("has an authored layout for every count up to sheet capacity", () => {
    for (let n = 1; n <= PER_SHEET_LANDSCAPE; n++) {
      expect(WALL_LANDSCAPE[n]).toBeDefined();
    }
    for (let n = 1; n <= PER_SHEET_PORTRAIT; n++) {
      expect(WALL_PORTRAIT[n]).toBeDefined();
    }
  });
});
