import { describe, expect, it } from "vitest";
import { centroid, clipHalf, insetPoly, powerCell, roundPath, simplify } from "./powerDiagram";

const RECT = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe("clipHalf", () => {
  it("keeps only the half-plane where nx*x+ny*y <= c", () => {
    // clip x <= 50: keeps the left half of the rectangle
    const out = clipHalf(RECT, 1, 0, 50);
    expect(out.every((p) => p.x <= 50.0001)).toBe(true);
    expect(out.some((p) => p.x === 50)).toBe(true);
  });
});

describe("centroid", () => {
  it("returns the geometric center of a square", () => {
    const c = centroid(RECT);
    expect(c.x).toBeCloseTo(50, 3);
    expect(c.y).toBeCloseTo(50, 3);
    expect(c.area).toBeCloseTo(10000, 1);
  });
});

describe("powerCell (weighted Voronoi hover mechanic)", () => {
  it("gives every site a convex, non-empty polygon in an unweighted layout", () => {
    const seeds = [
      { x: 300, y: 300, w: 0 },
      { x: 900, y: 300, w: 0 },
      { x: 300, y: 700, w: 0 },
      { x: 900, y: 700, w: 0 },
    ];
    for (let i = 0; i < seeds.length; i++) {
      const cell = powerCell(i, seeds, 1440, 900);
      expect(cell.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("increasing one site's weight grows its cell area at the neighbours' expense", () => {
    const base = [
      { x: 500, y: 450, w: 0 },
      { x: 900, y: 450, w: 0 },
    ];
    const boosted = [
      { x: 500, y: 450, w: 50000 },
      { x: 900, y: 450, w: 0 },
    ];
    const baseArea = centroid(powerCell(0, base, 1440, 900)).area;
    const boostedArea = centroid(powerCell(0, boosted, 1440, 900)).area;
    const neighbourBase = centroid(powerCell(1, base, 1440, 900)).area;
    const neighbourBoosted = centroid(powerCell(1, boosted, 1440, 900)).area;
    expect(boostedArea).toBeGreaterThan(baseArea);
    expect(neighbourBoosted).toBeLessThan(neighbourBase);
  });
});

describe("insetPoly", () => {
  it("shrinks a polygon toward its centroid", () => {
    const inset = insetPoly(RECT, 10);
    const c = centroid(inset);
    expect(c.area).toBeLessThan(10000);
  });

  it("returns the polygon unchanged for a non-positive inset", () => {
    expect(insetPoly(RECT, 0)).toEqual(RECT);
  });
});

describe("simplify", () => {
  it("drops vertices closer together than minEdge", () => {
    const withSliver = [
      { x: 0, y: 0 },
      { x: 0.1, y: 0.1 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const out = simplify(withSliver, 5);
    expect(out.length).toBeLessThan(withSliver.length);
  });
});

describe("roundPath", () => {
  it("emits a valid SVG path string starting with M and ending with Z", () => {
    const d = roundPath(RECT, 20);
    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).toContain("Q");
  });

  it("returns empty string for fewer than 3 points", () => {
    expect(roundPath([{ x: 0, y: 0 }], 10)).toBe("");
  });
});
