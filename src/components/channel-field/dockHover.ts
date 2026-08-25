/**
 * CONTACT — dock-hover proximity scale.
 *
 * The pointer-tracked "mechanical dock" hover on the channel plates
 * (`ChannelField.tsx`): each `a.cf-card`'s scale is driven by its real
 * distance to the pointer, not by a `:hover` pseudo-class alone — the
 * collage is a 2D grid, not a single row, so DOM-adjacency (`~`/`+`
 * selectors) would not track actual geometric proximity. This file holds
 * only the pure falloff math so it is testable without a DOM; the
 * pointermove/rAF orchestration lives in `ChannelField.tsx`.
 *
 * The curve is smoothstep, not linear — a softer proximity response reads
 * calmer than a hard cutoff. This is a SPATIAL falloff, not a time-domain
 * easing: doc 07's "no bouncing, no playful motion" ban is about the
 * transition's easing curve (still `--ease-hard`, see `channel-field.css`),
 * not about how scale varies with distance. Do not read this file as an
 * exception to that rule.
 */

/**
 * @param distance Pointer-to-card-center distance, in px. Always >= 0.
 * @param radius Distance at which the effect fully fades to 1. Must be > 0.
 * @param maxScale Scale applied at distance 0. Must be >= 1.
 */
export function dockScale(distance: number, radius: number, maxScale: number): number {
  if (distance >= radius) return 1;
  const t = 1 - distance / radius;
  const smoothed = t * t * (3 - 2 * t);
  return 1 + (maxScale - 1) * smoothed;
}
