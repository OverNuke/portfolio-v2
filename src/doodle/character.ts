import { rnd } from "./noise";
import type { Point } from "./smooth";

// Deterministic per-frame jitter + translate/scale, shared by every doodle
// stroke (guy limbs, sparks, spore rings). `frame` = Math.floor(t * 7.5) —
// quantized, not per-frame random, so it reads as hand-drawn, not static.
export function boil(pts: Point[], ox: number, oy: number, seed: number, frame: number, amp: number, scale = 1): Point[] {
  return pts.map((p, i) => [
    ox + p[0] * scale + rnd(i, frame, seed) * amp,
    oy + p[1] * scale + rnd(i + 41, frame, seed) * amp,
  ]);
}

// Blink curve: mostly open (1), snaps toward 0.08 once per ~3.9s cycle.
export function blink(t: number): number {
  const p = (t + 0.7) % 3.9;
  return p < 0.17 ? Math.max(0.08, Math.abs(Math.cos((p / 0.17) * Math.PI))) : 1;
}

// Rotates the arm skeleton around its shoulder pivot (px,py) by `angle` radians.
export function aimArm(arm: Point[], angle: number, px: number, py: number): Point[] {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  return arm.map(([x, y]) => [px + (x - px) * ca - (y - py) * sa, py + (x - px) * sa + (y - py) * ca]);
}

export interface ArrowStrokes {
  shaft: Point[];
  barbA: Point[];
  barbB: Point[];
}

// Shaft + two barbs growing from the hand (hx,hy) toward a target (tx,ty).
// `grow` in [0,1]; returns null below the mockup's own visibility threshold.
export function buildArrow(hx: number, hy: number, tx: number, ty: number, grow: number, back: number, bowK: number): ArrowStrokes | null {
  if (!grow || grow < 0.05) return null;
  let vx = tx - hx;
  let vy = ty - hy;
  const len = Math.hypot(vx, vy) || 1;
  const stop = Math.max(len - back, len * 0.3) * grow;
  vx /= len;
  vy /= len;
  const ex = hx + vx * stop;
  const ey = hy + vy * stop;
  const bow = Math.min(len * bowK, 60) * (vx > 0 ? -1 : 1);
  const shaft: Point[] = [];
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    const w = 4 * u * (1 - u);
    shaft.push([hx + (ex - hx) * u - vy * bow * w, hy + (ey - hy) * u + vx * bow * w]);
  }
  const last = shaft[6];
  const prev = shaft[5];
  const bx = last[0] - prev[0];
  const by = last[1] - prev[1];
  const bl = Math.hypot(bx, by) || 1;
  const ux = bx / bl;
  const uy = by / bl;
  const barb = (sgn: number): Point[] => [
    [ex - (ux * 0.94 - uy * sgn * 0.42) * 18, ey - (uy * 0.94 + ux * sgn * 0.42) * 18],
    [ex, ey],
  ];
  return { shaft, barbA: barb(1), barbB: barb(-1) };
}
