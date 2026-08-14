import { describe, expect, it } from "vitest";
import {
  assertProjectLayouts,
  getProjectLayout,
  PROJECT_LAYOUT_CAP,
  PROJECT_LAYOUTS,
  ROT_MAX,
} from "./projectLayouts";

describe("assertProjectLayouts", () => {
  it("passes for the real ladder", () => {
    expect(() => assertProjectLayouts()).not.toThrow();
  });

  it("catches a rotation past the cap", () => {
    const backup = PROJECT_LAYOUTS[1].feature.rot;
    PROJECT_LAYOUTS[1].feature.rot = ROT_MAX + 0.1;
    expect(() => assertProjectLayouts()).toThrow(/exceeds/);
    PROJECT_LAYOUTS[1].feature.rot = backup;
  });

  it("catches two cards overlapping", () => {
    const backup = PROJECT_LAYOUTS[1].feature.area;
    PROJECT_LAYOUTS[1].feature.area = PROJECT_LAYOUTS[1].colophon;
    expect(() => assertProjectLayouts()).toThrow(/overlaps/);
    PROJECT_LAYOUTS[1].feature.area = backup;
  });

  it("catches a grid-area outside the 12x12 bounds", () => {
    const backup = PROJECT_LAYOUTS[1].feature.area;
    PROJECT_LAYOUTS[1].feature.area = "1 / 1 / 14 / 5";
    expect(() => assertProjectLayouts()).toThrow(/outside the 12x12 grid/);
    PROJECT_LAYOUTS[1].feature.area = backup;
  });
});

describe("getProjectLayout", () => {
  it("returns the matching rung for every ladder count", () => {
    for (let n = 1; n <= PROJECT_LAYOUT_CAP; n++) {
      expect(getProjectLayout(n)).toBe(PROJECT_LAYOUTS[n]);
    }
  });

  it("clamps below the ladder to the smallest rung", () => {
    expect(getProjectLayout(0)).toBe(PROJECT_LAYOUTS[1]);
  });

  it("clamps above the cap to the largest rung", () => {
    expect(getProjectLayout(99)).toBe(PROJECT_LAYOUTS[PROJECT_LAYOUT_CAP]);
  });

  it("gives every rung a spread from 2 records up, and none at 1", () => {
    expect(PROJECT_LAYOUTS[1].spread).toBeUndefined();
    for (let n = 2; n <= PROJECT_LAYOUT_CAP; n++) {
      expect(PROJECT_LAYOUTS[n].spread).toBeDefined();
    }
  });

  it("gives each rung exactly the record count sheetLayout's assignSlots would produce", () => {
    // feature (1) + spread (0 or 1) + records === the rung's own key.
    for (let n = 1; n <= PROJECT_LAYOUT_CAP; n++) {
      const layout = PROJECT_LAYOUTS[n];
      const total = 1 + (layout.spread ? 1 : 0) + layout.records.length;
      expect(total).toBe(n);
    }
  });
});
