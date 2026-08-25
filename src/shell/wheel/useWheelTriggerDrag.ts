import { useEffect, useRef } from "react";
import { cubicBezier } from "animejs";
import { createDraggable, type Draggable } from "animejs/draggable";

/**
 * sdd/animejs-wheel-trigger-drag. Makes `.wheel-trigger` (the closed-state
 * icon button in `ModuleWheel.tsx`) user-repositionable via pointer drag,
 * while its click/keyboard paths stay untouched — see
 * `sdd/animejs-wheel-trigger-drag/spec` for the observable contract and
 * `.../design` (D1-D6) for the anime.js API rationale this file implements
 * line-for-line. Pattern: sibling of `useWheelGate.ts`, called
 * unconditionally from `ModuleWheel`'s body.
 *
 * `ModuleWheel` stays mounted across open/close; only the `<button>` this
 * hook targets unmounts and remounts every time the wheel opens and
 * closes. `offsetRef` is what survives that remount — a plain `useRef`,
 * not component state, because nothing here should ever trigger a
 * re-render.
 */

export interface WheelTriggerDragOptions {
  /** `!open` — the trigger only exists in the DOM while the wheel is closed. */
  enabled: boolean;
  reducedMotion: boolean;
}

/**
 * D1 (design): pinned to `--space-xs` (`src/styles/tokens.css:99`), not a
 * bare guess — JS can't read a CSS custom property, so this is kept in
 * sync with the token by hand.
 */
const CONTAINER_PADDING = 8;

/**
 * D2 (design): duplicates `--ease-hard`'s control points
 * (`07_ANIMATION_GUIDELINES.md`'s house hard-cut curve). A JS ease cannot
 * read a CSS custom property either, so this is the same by-hand
 * duplication as `CONTAINER_PADDING` above — keep both in sync with
 * `tokens.css` if either ever changes.
 */
const RELEASE_EASE = cubicBezier(0.7, 0, 0.3, 1);

/**
 * Reads `draggable.x`/`.y` defensively. Corrects an assumption in
 * design D1: `Draggable#x`/`#y` are getters that read
 * `this.animate[this.xProp]()` (`draggable.js:481-482`), and neither
 * `this.animate` nor `this.xProp` is assigned until later in the
 * constructor (`draggable.js:283-286`) — well after `container` (this
 * function's caller) runs at `draggable.js:184`. So the very first,
 * construction-time call doesn't just read `undefined`, it THROWS
 * (`Cannot read properties of undefined`). `?? 0` alone only guards a
 * missing value, not a throw — this needs try/catch too. Discovered via
 * the real (unmocked) library in `ModuleWheel.test.tsx`; the mocked unit
 * tests in `useWheelTriggerDrag.test.ts` couldn't catch it, since a plain
 * mock object's `.x` is simply `undefined`, never throws.
 */
function readAxis(get: () => number): number {
  try {
    return get() ?? 0;
  } catch {
    return 0;
  }
}

export function useWheelTriggerDrag(
  ref: React.RefObject<HTMLButtonElement | null>,
  { enabled, reducedMotion }: WheelTriggerDragOptions,
): void {
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    // Refs are detached before passive-effect cleanup runs (D6's gotcha) —
    // capture the node now so both the `container` fn and the cleanup
    // below close over a stable value instead of re-reading `ref.current`.
    const el = ref.current;
    if (!enabled || !el) return;

    const draggable = createDraggable(el, {
      // D1: a numeric-bounds function, not `document.body` or a bare
      // selector — `.wheel-trigger` itself is not `position: fixed` (only
      // its ancestor `.wheel` is), so the library's own fixed-position
      // viewport clamp never engages for it. Re-evaluated on every
      // `refresh()`, so it stays correct across the resize handling below.
      container: (draggable: Draggable) => {
        const rect = el.getBoundingClientRect(); // includes the current transform
        // Guard: this fn runs during construction, before `draggable.x`/
        // `.y` can be safely read (see `readAxis` above) — unguarded,
        // the very first call throws, and every later call would
        // propagate that throw straight out of `parseDraggableFunctionParameter`.
        const dx = readAxis(() => draggable.x);
        const dy = readAxis(() => draggable.y);
        const left = rect.left - dx; // untransformed base position
        const top = rect.top - dy;
        return [
          -top, // minY
          window.innerWidth - rect.width - left, // maxX
          window.innerHeight - rect.height - top, // maxY
          -left, // minX
        ];
      },
      containerPadding: CONTAINER_PADDING,
      // D2: overshoot/bounce is killed by friction, not by easing — this is
      // the anti-overshoot control per `07_ANIMATION_GUIDELINES.md`'s
      // no-spring rule. `containerFriction` (drag-time resistance) is left
      // at its native `.8` default (D3) for the rubber-band-near-the-edge
      // feel; only release-time friction is forced to 1.
      releaseContainerFriction: 1,
      releaseEase: RELEASE_EASE,
      // D4: reduced motion zeroes the velocity trio the release-settle
      // duration is partly derived from. This produces an instant settle
      // for the common case — a release that's already resting within
      // `containerBounds` (`draggable.js:1023`'s `cx === dx` branch).
      // A release that lands OUTSIDE bounds still animates the boundary
      // correction over a non-zero duration regardless (verified against
      // the real library in `e2e/wheel-trigger-drag.spec.ts`, which polls
      // for that settle rather than asserting it's instant) —
      // `releaseContainerFriction: 1` above still guarantees the FINAL
      // resting position is correctly clamped either way.
      ...(reducedMotion
        ? { velocityMultiplier: 0, maxVelocity: 0, minVelocity: 0 }
        : {}),
      // Position Persists Across Wheel Open/Close: the only place the
      // dragged offset is ever written.
      onRelease: (d: Draggable) => {
        offsetRef.current = { x: d.x, y: d.y };
      },
    });

    // Restore any previously-dragged offset after this remount — `true`
    // mutes the update callback so restoring position never re-triggers
    // `onRelease`/`onUpdate`.
    draggable.setX(offsetRef.current.x, true);
    draggable.setY(offsetRef.current.y, true);

    // D1's resize gotcha: the library's own `resizeObserver` falls back to
    // observing `document.body`, which tracks viewport WIDTH, not height —
    // a mobile URL-bar collapse would otherwise strand the button out of
    // bounds with no re-clamp. `refresh()` re-evaluates the `container` fn
    // above; the explicit re-apply after it re-clamps the stored offset
    // against the fresh bounds.
    function onResize() {
      draggable.refresh();
      draggable.setX(offsetRef.current.x, true);
      draggable.setY(offsetRef.current.y, true);
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      // D6: `.revert()`, never `.disable()` — `disable()` leaves listeners
      // and inline styles behind, which double-invokes badly under
      // StrictMode across this button's frequent unmount/remount cycle.
      draggable.revert();
    };
    // `ref` is included for `react-hooks/exhaustive-deps` — it never
    // actually changes identity (a `useRef` object is stable for the
    // component's lifetime), so this doesn't change when the effect reruns
    // versus design's literal `[enabled, reducedMotion]`.
  }, [enabled, reducedMotion, ref]);
}
