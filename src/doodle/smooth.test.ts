import { describe, expect, it } from "vitest";
import { smooth, type Point } from "./smooth";

describe("smooth (Catmull-Rom -> cubic Bezier)", () => {
  it("returns empty string for fewer than 2 points", () => {
    expect(smooth([], false)).toBe("");
    expect(smooth([[0, 0]], false)).toBe("");
  });

  it("draws a straight line for exactly 2 points", () => {
    const pts: Point[] = [[0, 0], [10, 10]];
    expect(smooth(pts, false)).toBe("M0.0 0.0L10.0 10.0");
  });

  it("open paths start with M and contain no closing Z", () => {
    const pts: Point[] = [[0, 0], [5, 10], [10, 0]];
    const d = smooth(pts, false);
    expect(d.startsWith("M0.0 0.0")).toBe(true);
    expect(d.endsWith("Z")).toBe(false);
  });

  it("closed paths wrap the last segment back to the first point and end with Z", () => {
    const pts: Point[] = [[0, 0], [5, 10], [10, 0]];
    const d = smooth(pts, true);
    expect(d.endsWith("Z")).toBe(true);
    // closed emits one C segment per point (wraps), open emits n-1
    expect(d.match(/C/g)?.length).toBe(3);
  });
});
