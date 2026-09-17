export type Point = [number, number];

// Catmull-Rom -> cubic Bezier, standard 1/6 tangent, emitting SVG `C` segments.
// `closed` wraps the last segment back to the first point and appends `Z`.
export function smooth(pts: Point[], closed: boolean): string {
  const n = pts.length;
  if (n < 2) return "";
  if (n === 2) {
    return `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}L${pts[1][0].toFixed(1)} ${pts[1][1].toFixed(1)}`;
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p1 = pts[i % n];
    const p2 = pts[(i + 1) % n];
    const p0 = closed ? pts[(i - 1 + n) % n] : pts[Math.max(i - 1, 0)];
    const p3 = closed ? pts[(i + 2) % n] : pts[Math.min(i + 2, n - 1)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)},${c2x.toFixed(1)} ${c2y.toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + (closed ? "Z" : "");
}
