export interface Vec2 {
  x: number;
  y: number;
}

export interface Site extends Vec2 {
  w: number;
}

export interface Centroid extends Vec2 {
  area: number;
}

// Clips a convex polygon to the half-plane { p : nx*p.x + ny*p.y <= c }.
export function clipHalf(poly: Vec2[], nx: number, ny: number, c: number): Vec2[] {
  const out: Vec2[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const da = nx * a.x + ny * a.y - c;
    const db = nx * b.x + ny * b.y - c;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

// Power diagram (additively weighted Voronoi): cell of site s is
// { p : |p-s|²-w_s <= |p-q|²-w_q } for every other site q. This is what
// makes hover-driven weight growth swell a cell at its neighbours' expense.
export function powerCell(i: number, seeds: Site[], width: number, height: number): Vec2[] {
  const M = 13;
  let p: Vec2[] = [
    { x: M, y: M },
    { x: width - M, y: M },
    { x: width - M, y: height - M },
    { x: M, y: height - M },
  ];
  const s = seeds[i];
  for (let j = 0; j < seeds.length && p.length >= 3; j++) {
    if (j === i) continue;
    const q = seeds[j];
    const dx = q.x - s.x;
    const dy = q.y - s.y;
    if (dx * dx + dy * dy < 1e-6) continue;
    p = clipHalf(p, 2 * dx, 2 * dy, q.x * q.x + q.y * q.y - s.x * s.x - s.y * s.y + s.w - q.w);
  }
  return p;
}

export function centroid(poly: Vec2[]): Centroid {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const f = p.x * q.y - q.x * p.y;
    a += f;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  if (Math.abs(a) < 1e-6) return { x: poly[0]?.x ?? 0, y: poly[0]?.y ?? 0, area: 0 };
  return { x: cx / (3 * a), y: cy / (3 * a), area: Math.abs(a / 2) };
}

// Convex polygons inset exactly by re-clipping with each edge pushed inward.
export function insetPoly(poly: Vec2[], d: number): Vec2[] {
  if (d <= 0 || poly.length < 3) return poly;
  const c = centroid(poly);
  let p = poly;
  for (let i = 0; i < poly.length && p.length >= 3; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    let ex = b.x - a.x;
    let ey = b.y - a.y;
    const L = Math.hypot(ex, ey) || 1;
    ex /= L;
    ey /= L;
    let nx = ey;
    let ny = -ex;
    if (nx * (a.x - c.x) + ny * (a.y - c.y) < 0) {
      nx = -nx;
      ny = -ny;
    }
    p = clipHalf(p, nx, ny, nx * a.x + ny * a.y - d);
  }
  return p;
}

// Drops vertices closer together than minEdge (clip slivers) and near-collinear
// vertices, so a short clipped edge never survives to receive a rounded corner.
export function simplify(poly: Vec2[], minEdge: number): Vec2[] {
  if (poly.length < 4) return poly;
  const out: Vec2[] = [];
  for (const v of poly) {
    const last = out[out.length - 1];
    if (last && Math.hypot(v.x - last.x, v.y - last.y) < minEdge) continue;
    out.push(v);
  }
  while (out.length > 3 && Math.hypot(out[0].x - out[out.length - 1].x, out[0].y - out[out.length - 1].y) < minEdge) {
    out.pop();
  }
  if (out.length < 3) return poly;
  const keep: Vec2[] = [];
  for (let i = 0; i < out.length; i++) {
    const v = out[i];
    const p = out[(i - 1 + out.length) % out.length];
    const q = out[(i + 1) % out.length];
    const l1 = Math.hypot(p.x - v.x, p.y - v.y) || 1;
    const l2 = Math.hypot(q.x - v.x, q.y - v.y) || 1;
    const dot = ((p.x - v.x) * (q.x - v.x) + (p.y - v.y) * (q.y - v.y)) / (l1 * l2);
    if (dot > -0.9995) keep.push(v);
  }
  return keep.length >= 3 ? keep : out;
}

// Corner rounding via cut distance derived from the corner angle (r / tan(θ/2))
// so a sharp corner blunts instead of keeping a spike with a token fillet.
export function roundPath(poly: Vec2[], r: number): string {
  const n = poly.length;
  if (n < 3) return "";
  let d = "";
  for (let i = 0; i < n; i++) {
    const v = poly[i];
    const p = poly[(i - 1 + n) % n];
    const q = poly[(i + 1) % n];
    const l1 = Math.hypot(p.x - v.x, p.y - v.y) || 1;
    const l2 = Math.hypot(q.x - v.x, q.y - v.y) || 1;
    const dot = Math.max(-1, Math.min(1, ((p.x - v.x) * (q.x - v.x) + (p.y - v.y) * (q.y - v.y)) / (l1 * l2)));
    const half = Math.acos(dot) / 2;
    const rr = Math.min(r / Math.max(Math.tan(half), 0.12), l1 * 0.5, l2 * 0.5);
    const ax = v.x + ((p.x - v.x) / l1) * rr;
    const ay = v.y + ((p.y - v.y) / l1) * rr;
    const bx = v.x + ((q.x - v.x) / l2) * rr;
    const by = v.y + ((q.y - v.y) / l2) * rr;
    d += (i === 0 ? "M" : "L") + ax.toFixed(1) + " " + ay.toFixed(1);
    d += "Q" + v.x.toFixed(1) + " " + v.y.toFixed(1) + " " + bx.toFixed(1) + " " + by.toFixed(1);
  }
  return d + "Z";
}
