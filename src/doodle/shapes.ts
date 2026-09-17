import type { Point } from "./smooth";

// Shared crayon-character skeleton, byte-identical between Distinction v4 and
// Projects v2 (D4). Coordinates are relative to the character's own origin.
export const GUY_BODY: Point[] = [[-30, -18], [-35, 4], [-29, 25], [-9, 34], [16, 31], [31, 13], [33, -9], [21, -25], [-7, -29]];
export const GUY_EAR_L: Point[] = [[-27, -22], [-32, -41], [-20, -44], [-15, -26]];
export const GUY_EAR_R: Point[] = [[10, -27], [15, -46], [27, -42], [25, -23]];
export const GUY_ARM: Point[] = [[31, 2], [47, -5], [56, -20]];
export const SPARK: Point[] = [[0, -19], [5, -6], [18, 0], [5, 6], [0, 19], [-5, 6], [-18, 0], [-5, -6]];

// Points evenly spaced around an ellipse centered at (cx,cy), used for the
// doodle "ring" annotations around photos/tags/spores.
export function ellipsePts(cx: number, cy: number, rx: number, ry: number, n: number, rot: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 + (rot || 0);
    out.push([cx + Math.cos(th) * rx, cy + Math.sin(th) * ry]);
  }
  return out;
}

interface GlyphStroke {
  p: Point[];
  c?: boolean;
}

interface Glyph {
  w: number;
  s: GlyphStroke[];
}

// Single-stroke marker skeletons for the hand-lettered "PROJECTS" headline
// (Projects Section v2). Only the letters actually used are ported.
export const GLYPHS: Record<string, Glyph> = {
  P: { w: 48, s: [{ p: [[2, 2], [0, 90]] }, { p: [[2, 2], [32, 8], [40, 26], [28, 44], [1, 46]] }] },
  R: { w: 50, s: [{ p: [[2, 2], [0, 90]] }, { p: [[2, 2], [32, 8], [40, 24], [26, 42], [1, 43]] }, { p: [[18, 42], [44, 90]] }] },
  O: { w: 58, s: [{ p: [[32, 2], [52, 18], [56, 46], [42, 80], [18, 86], [3, 58], [6, 24]], c: true }] },
  J: { w: 48, s: [{ p: [[6, 2], [44, 6]] }, { p: [[32, 5], [30, 62], [20, 84], [6, 80], [2, 62]] }] },
  E: { w: 46, s: [{ p: [[4, 2], [0, 90]] }, { p: [[4, 2], [42, 0]] }, { p: [[2, 44], [32, 42]] }, { p: [[0, 90], [42, 86]] }] },
  C: { w: 56, s: [{ p: [[50, 16], [30, 2], [9, 16], [3, 48], [14, 78], [36, 86], [52, 72]] }] },
  T: { w: 50, s: [{ p: [[0, 3], [48, 0]] }, { p: [[25, 2], [22, 90]] }] },
  S: { w: 50, s: [{ p: [[46, 14], [26, 2], [8, 12], [12, 33], [34, 45], [47, 60], [40, 80], [16, 86], [3, 72]] }] },
};

export interface WordStroke {
  pts: Point[];
  c: boolean;
}

// Lays out a word's glyph strokes left-to-right at (x0,y0), scaled by `sc`
// with `gap` extra spacing between letters. Unknown characters are skipped.
export function layoutWord(word: string, x0: number, y0: number, sc: number, gap: number): WordStroke[] {
  const out: WordStroke[] = [];
  let x = x0;
  for (const ch of word) {
    const g = GLYPHS[ch];
    if (!g) continue;
    g.s.forEach((st) => out.push({ pts: st.p.map(([px, py]) => [x + px * sc, y0 + py * sc]), c: !!st.c }));
    x += g.w * sc + gap * sc;
  }
  return out;
}
