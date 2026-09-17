// Deterministic per-(point,frame,shape) noise — the hand-drawn "boil".
// Ported verbatim from Distinction Section v4 / Projects Section v2 (byte-
// identical in both mockups). A sine-hash, not a PRNG: same inputs, same output.
export function rnd(a: number, b: number, c: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}
