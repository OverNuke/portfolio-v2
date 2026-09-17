import { describe, expect, it } from "vitest";
import { ellipsePts, GLYPHS, layoutWord, GUY_BODY, SPARK } from "./shapes";

describe("ellipsePts", () => {
  it("returns n points evenly spaced around the ellipse", () => {
    const pts = ellipsePts(0, 0, 10, 5, 4, 0);
    expect(pts).toHaveLength(4);
    expect(pts[0][0]).toBeCloseTo(10, 5);
    expect(pts[0][1]).toBeCloseTo(0, 5);
  });

  it("respects center offset and rotation", () => {
    const pts = ellipsePts(100, 50, 10, 10, 8, Math.PI / 4);
    for (const [x, y] of pts) {
      const dx = x - 100, dy = y - 50;
      expect(Math.hypot(dx, dy)).toBeCloseTo(10, 5);
    }
  });
});

describe("layoutWord", () => {
  it("skips unknown characters", () => {
    const strokes = layoutWord("PX", 0, 0, 1, 0);
    // P has known strokes, X is not in GLYPHS — only P's contribute
    expect(strokes.length).toBe(GLYPHS.P.s.length);
  });

  it("advances x per glyph by glyph width plus gap", () => {
    const strokes = layoutWord("PP", 0, 0, 1, 10);
    const firstX = strokes[0].pts[0][0];
    const secondP = strokes[GLYPHS.P.s.length];
    expect(secondP.pts[0][0]).toBeCloseTo(firstX + GLYPHS.P.w + 10, 5);
  });
});

describe("shared character skeletons", () => {
  it("GUY_BODY and SPARK are non-empty point arrays", () => {
    expect(GUY_BODY.length).toBeGreaterThan(0);
    expect(SPARK.length).toBeGreaterThan(0);
  });
});
