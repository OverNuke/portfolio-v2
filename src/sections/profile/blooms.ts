export interface Bloom {
  x: number;
  y: number;
  rMax: number;
  sx: number;
  sy: number;
  rot: number;
  life: number;
  age: number;
  phase: number;
  k1: number;
  k2: number;
  k3: number;
  h1: number;
  h2: number;
  h3: number;
  drift: number;
  rise: number;
}

// Ported from Profile Section v4's `boot()`. `rand` defaults to Math.random
// but is injectable so the seed math itself stays unit-testable (D15).
export function makeBloom(width: number, height: number, seeded: boolean, rand: () => number = Math.random): Bloom {
  const rnd = (a: number, b: number) => a + rand() * (b - a);
  return {
    x: rnd(0.14, 0.6) * width,
    y: rnd(0.12, 0.9) * height,
    rMax: rnd(46, 128),
    sx: rnd(0.82, 1.5),
    sy: rnd(0.6, 1.18),
    rot: rnd(0, Math.PI * 2),
    life: rnd(9, 18),
    age: seeded ? rnd(0, 9) : 0,
    phase: rnd(0, 10),
    k1: rnd(0.14, 0.3),
    k2: rnd(0.07, 0.18),
    k3: rnd(0.04, 0.11),
    h1: 3 + Math.floor(rnd(0, 3)),
    h2: 5 + Math.floor(rnd(0, 3)),
    h3: 8 + Math.floor(rnd(0, 4)),
    drift: rnd(-5, 5),
    rise: rnd(-7, 3),
  };
}

// 3-term harmonic lobe — the radius modulation that makes each bloom read as
// an organic ink blot instead of a plain circle.
export function lobe(b: Bloom, t: number, ang: number): number {
  const p = b.phase + t * 1.1;
  return 1 + b.k1 * Math.sin(b.h1 * ang + p) + b.k2 * Math.sin(b.h2 * ang - p * 1.4) + b.k3 * Math.sin(b.h3 * ang + p * 0.7);
}

// Radius over the bloom's life (t in [0,1]): fast initial growth, eased tail.
export function bloomRadius(b: Bloom, t: number): number {
  return 8 + b.rMax * (1 - Math.pow(1 - t, 2.6));
}

// Fade curve: ramps in over the first 16% of life, then eases back out.
export function bloomFade(t: number): number {
  return Math.min(1, t / 0.16) * Math.pow(1 - t, 1.5);
}
