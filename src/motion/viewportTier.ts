import { useSyncExternalStore } from "react";

/**
 * The three tiers `/projects` actually has. Named here once so TypeScript
 * and CSS cannot drift: `viewportTier.test.ts` reads the two numbers back
 * out of `project-field.css` and fails if either moves without the other.
 *
 * They are not arbitrary. 900 is where the composition CHANGES — the
 * bounded stage releases and every record becomes a poster
 * (`project-field.css` §POSTER). 1100 is where the same composition just
 * gets SMALLER (`--pf-max` drops to 900px), which is why crossing it
 * needs no motion work at all: every position is a percentage, so nothing
 * moves relative to anything else.
 */
export const TIER_MAX = {
  /** At or below this, the poster stack. */
  phone: 900,
  /** At or below this (and above `phone`), the field at a narrower measure. */
  tablet: 1100,
} as const;

export type ViewportTier = "pc" | "tablet" | "phone";

export function tierForWidth(width: number): ViewportTier {
  if (width <= TIER_MAX.phone) return "phone";
  if (width <= TIER_MAX.tablet) return "tablet";
  return "pc";
}

const PHONE_QUERY = `(max-width: ${TIER_MAX.phone}px)`;
const TABLET_QUERY = `(max-width: ${TIER_MAX.tablet}px)`;

function canMatch(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

/**
 * The tier RIGHT NOW, read straight from the media queries rather than
 * from React state. `useReform` needs this: on a resize it has to know
 * whether a tier change is already in flight before React has re-rendered
 * to tell it. Reading `matchMedia` rather than `window.innerWidth` so it
 * can never disagree with the stylesheet by a scrollbar's width.
 */
export function readViewportTier(): ViewportTier {
  return getSnapshot();
}

function getSnapshot(): ViewportTier {
  // Same feature detection as `shell/useReducedMotion.ts`, for the same
  // reason: jsdom has no `matchMedia`, and a hook that throws there takes
  // the whole component's test suite with it.
  if (!canMatch()) return "pc";
  if (window.matchMedia(PHONE_QUERY).matches) return "phone";
  if (window.matchMedia(TABLET_QUERY).matches) return "tablet";
  return "pc";
}

function getServerSnapshot(): ViewportTier {
  return "pc";
}

function subscribe(callback: () => void): () => void {
  if (!canMatch()) return () => {};
  const lists = [window.matchMedia(PHONE_QUERY), window.matchMedia(TABLET_QUERY)];
  for (const mql of lists) mql.addEventListener("change", callback);
  return () => {
    for (const mql of lists) mql.removeEventListener("change", callback);
  };
}

/**
 * Which tier the viewport is in, as a value a component can key on.
 *
 * Deliberately media-query driven rather than a resize listener: the two
 * queries fire only when a boundary is actually crossed, so dragging a
 * window across 400px of desktop width costs nothing, and the value only
 * changes when the composition it names changes.
 */
export function useViewportTier(): ViewportTier {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
