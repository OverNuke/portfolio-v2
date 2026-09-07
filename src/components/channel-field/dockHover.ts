/**
 * CONTACT — dock-hover proximity model (gaussian, all cards).
 *
 * The pointer-tracked "mechanical dock" on the channel plates
 * (`ChannelField.tsx`): every `a.cf-card` lifts by its distance to the
 * pointer — an anisotropic 2D gaussian, strongest under the cursor, decaying
 * exponentially outward. This file holds only the pure falloff math so it is
 * testable without a DOM; the pointermove/rAF orchestration lives in
 * `ChannelField.tsx`.
 *
 * WHY GAUSSIAN, AND WHY THIS DOES NOT REINTRODUCE THE `5d889c9` TWITCH.
 * The commit `5d889c9` replaced an all-cards `smoothstep`-inside-a-hard-radius
 * scorer with a nearest-wins one, because three plate centres sat 175-194px
 * apart, all landed inside the 240px radius with comparable targets, and the
 * field rippled. The gaussian decays exponentially, so it orders the field
 * sharply instead: with the pointer on one plate that plate reads `f = 1`, its
 * nearest neighbour a clearly-subordinate ~0.4, and the rest at rest. One
 * dominant lobe, not a plateau — see the single-lobed ordering test in
 * `dockHover.test.ts`, which is the guard against that regression coming back.
 *
 * This is a SPATIAL falloff, not a time-domain easing: doc 07's "no bouncing,
 * no playful motion" ban is about the transition's easing curve (the eased
 * factor is stepped by `damping.ts` in the writer), not about how the factor
 * varies with distance. Do not read this file as an exception to that rule.
 *
 * The eased 0..1 factor is the ONLY thing `ChannelField.tsx` carries per card;
 * scale / lift / z are derived from it by `dockValues` at write time, so they
 * can never desync and `isSettled`'s dimensionless 0.001 threshold stays
 * correct (it is not, against a 10px lift).
 */

export interface DockCard<T> {
  key: T;
  centerX: number;
  centerY: number;
}

export interface DockValues {
  scale: number;
  lift: number;
  z: number;
}

/** Box geometry as read straight off an `HTMLElement`'s `offset*` fields —
 *  untransformed, unlike `getBoundingClientRect()`, which returns the
 *  *transformed* rect and would feed a lifted card's own displacement back
 *  into its factor. */
export interface CardBox {
  offsetLeft: number;
  offsetTop: number;
  offsetWidth: number;
  offsetHeight: number;
}

/**
 * Anisotropic gaussian, always in `[0, 1]`. Horizontal distance dominates;
 * vertical is softened by `anisotropy` (2.2 in practice) so a pointer sweeping
 * ACROSS the field raises one moving lobe rather than a whole column of
 * plates. `f(0, 0) === 1`.
 *
 * @param dx Pointer-to-centre horizontal offset, px (sign irrelevant).
 * @param dy Pointer-to-centre vertical offset, px (sign irrelevant).
 * @param spread Distance scale, px. Floored like `damping.ts`'s `tau` so a
 *   pre-layout `offsetWidth` of 0 yields a finite factor, not `NaN`.
 * @param anisotropy Vertical softening multiplier. `> 1` widens the lobe
 *   vertically; `1` is isotropic.
 */
export function dockFactor(dx: number, dy: number, spread: number, anisotropy: number): number {
  const s = Math.max(spread, 0.001);
  const nx = dx / s;
  const ny = dy / (s * anisotropy);
  return Math.exp(-(nx * nx + ny * ny));
}

/**
 * Per-card factors, keyed like the input. A `null` pointer — the pointer has
 * left the stage — resolves every card to `0` (full rest). Coordinates are
 * stage-local: the caller converts client coords and reads centres from
 * `offset*`, both in the stage's untransformed space.
 */
export function dockFactors<T>(
  pointer: { x: number; y: number } | null,
  cards: readonly DockCard<T>[],
  spread: number,
  anisotropy: number,
): Map<T, number> {
  const factors = new Map<T, number>();
  for (const card of cards) {
    factors.set(
      card.key,
      pointer ? dockFactor(pointer.x - card.centerX, pointer.y - card.centerY, spread, anisotropy) : 0,
    );
  }
  return factors;
}

/**
 * The eased factor -> the three written values. Pure, so the register caps
 * (`docs/01_ART_DIRECTION.MD` Instrument row: scale <= 1.10, lift px-capped)
 * are unit-assertable rather than only commented.
 *
 * `scale = 1 + (maxScale - 1) * f` is `dockScale`'s old shape with the
 * gaussian substituted for smoothstep — which is exactly why the old
 * `dockScale` smoothstep helper was deleted rather than kept: two spatial
 * falloff curves in one file with one consumer is the stale code this
 * module's header exists to prevent.
 */
export function dockValues(f: number, maxScale: number, maxLiftPx: number, maxZ: number): DockValues {
  const lift = -maxLiftPx * f;
  return {
    scale: 1 + (maxScale - 1) * f,
    // `|| 0` normalises the `-0` that `-x * 0` produces, so a resting card
    // writes `translate: 0 0px`, never `0 -0px`.
    lift: lift || 0,
    z: Math.round(f * maxZ),
  };
}

/** Untransformed box midpoint, from `offset*` only. Takes the geometry, not
 *  the element, so it never touches `getBoundingClientRect` — see `CardBox`. */
export function cardCenter(box: CardBox): { x: number; y: number } {
  return {
    x: box.offsetLeft + box.offsetWidth / 2,
    y: box.offsetTop + box.offsetHeight / 2,
  };
}
