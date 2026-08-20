import { describe, expect, it } from "vitest";
import {
  PER_SHEET_LANDSCAPE,
  PER_SHEET_PORTRAIT,
  WALL_LANDSCAPE,
  WALL_PORTRAIT,
  assertCertLayouts,
  assignSlots,
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

  it("every WALL_LANDSCAPE rung declares at most one wantsHero slot", () => {
    for (const layout of Object.values(WALL_LANDSCAPE)) {
      const heroSlots = layout.slots.filter((s) => s.wantsHero);
      expect(heroSlots.length).toBeLessThanOrEqual(1);
    }
  });

  it("the 6-count bento rung keeps a 2/2/2 tone balance, matching the design handoff", () => {
    const tones = WALL_LANDSCAPE[6].slots.map((s) => s.tone);
    const counts = { light: 0, mid: 0, dark: 0 } as Record<string, number>;
    for (const t of tones) if (t) counts[t] += 1;
    expect(counts).toEqual({ light: 2, mid: 2, dark: 2 });
  });

  it("assignSlots sends the hero-flagged record to the wantsHero slot regardless of array position", () => {
    const records = [
      { orientation: "landscape" as const, hero: false },
      { orientation: "landscape" as const, hero: true },
      { orientation: "landscape" as const, hero: false },
    ];
    const order = assignSlots(records, WALL_LANDSCAPE[3].slots);
    // Slot 0 (index 0) is the wantsHero lead slot for the 3-count rung.
    expect(order[0]).toBe(1);
  });

  it("assignSlots falls back to positional order when no record is hero-flagged", () => {
    const records = [
      { orientation: "landscape" as const, hero: false },
      { orientation: "landscape" as const, hero: false },
      { orientation: "landscape" as const, hero: false },
    ];
    const order = assignSlots(records, WALL_LANDSCAPE[3].slots);
    expect(order).toEqual([0, 1, 2]);
  });
});
