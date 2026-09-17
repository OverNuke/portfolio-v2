// Gaussian proximity falloff — no springs, no simulation (D10). Caller
// pre-normalizes dx by `spread` and dy by `spread * 2.2` so the dock reads
// horizontally rather than as a symmetric radial field.
export function dockFalloff(dx: number, dy: number): number {
  return Math.exp(-(dx * dx + dy * dy));
}
