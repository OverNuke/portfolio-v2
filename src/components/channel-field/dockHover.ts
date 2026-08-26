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

/**
 * CONTACT — dock-hover nearest-wins selection.
 *
 * The stage packs plates close enough that a single pointer position can sit
 * inside more than one plate's `radius` at once (measured: Email/GitHub/
 * Whatsapp centers only 175-194px apart at the ≥1181px tier, well inside the
 * 240px `DOCK_RADIUS_PX`). Scoring every card independently against the
 * pointer — the original approach — let all of them react at once, which
 * reads as the whole field twitching rather than one instrument acknowledging
 * the cursor. Only the single nearest in-radius card gets a real target here;
 * every other card's target is `1`, which the caller eases back toward over
 * several frames rather than snapping (a snap is the other half of what made
 * this feel rough).
 *
 * Pure and DOM-free like `dockScale` — `key` is generic so this is testable
 * without touching `getBoundingClientRect`.
 */
export interface DockCard<T> {
  key: T;
  centerX: number;
  centerY: number;
}

/**
 * @param pointer Pointer position, or `null` when the pointer has left the
 *   stage — every card then targets `1`.
 * Ties resolve to whichever card appears first in `cards` (strict `<`
 * comparison never displaces an already-found nearest card at equal
 * distance), which in practice means DOM order.
 */
export function dockTargets<T>(
  pointer: { x: number; y: number } | null,
  cards: readonly DockCard<T>[],
  radius: number,
  maxScale: number,
): Map<T, number> {
  const targets = new Map<T, number>();
  if (!pointer) {
    for (const card of cards) targets.set(card.key, 1);
    return targets;
  }

  let nearest: DockCard<T> | null = null;
  let nearestDistance = Infinity;
  for (const card of cards) {
    const distance = Math.hypot(pointer.x - card.centerX, pointer.y - card.centerY);
    if (distance < radius && distance < nearestDistance) {
      nearest = card;
      nearestDistance = distance;
    }
  }

  for (const card of cards) {
    targets.set(card.key, card === nearest ? dockScale(nearestDistance, radius, maxScale) : 1);
  }
  return targets;
}
