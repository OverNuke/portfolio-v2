import { useLayoutEffect, useRef, type RefObject } from "react";

/** Parts opt in by carrying this attribute; its value is the part's identity. */
const ID_ATTR = "data-reform-id";
/** `data-reform-scale="none"` moves a part without resizing it. */
const SCALE_ATTR = "data-reform-scale";
/** `data-reform-rank="2"` delays a part by 2 stagger steps. */
const RANK_ATTR = "data-reform-rank";

/** Mirrors `--dur-reform` / `--stagger-rank` in `src/styles/tokens.css`. */
export const REFORM_DURATION = 560;
export const REFORM_STAGGER = 55;
/** Mirrors `--ease-soft`. */
export const REFORM_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Below this, a part has not really moved and animating it is noise. */
const MOVE_EPSILON = 1;
const SCALE_EPSILON = 0.01;

type RectMap = Map<string, DOMRect>;

function measure(root: HTMLElement): { rects: RectMap; parts: HTMLElement[] } {
  const parts = Array.from(root.querySelectorAll<HTMLElement>(`[${ID_ATTR}]`));
  const rects: RectMap = new Map();
  for (const el of parts) {
    const id = el.getAttribute(ID_ATTR);
    if (id) rects.set(id, el.getBoundingClientRect());
  }
  return { rects, parts };
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * FLIP for a set of parts that keep their identity across a layout change.
 *
 * Measure before, let the browser lay out, measure after, invert with a
 * transform, then release. Nothing in here knows about `/projects` — that
 * is the point: the same hook is what makes this reusable on Certificates
 * and Skills. See `docs/14_REFORM_MOTION.md`.
 *
 * THE PART THAT IS NOT TEXTBOOK FLIP, and the reason this is a hook rather
 * than four lines inlined in a component: several of the parts it animates
 * ALREADY use `transform` for their own layout — `.pf-record__figure`
 * centres itself with `translateY(-50%)`. A naive FLIP writes over that
 * and the element snaps to its untransformed position before it animates.
 * So the inverse is composed ON TOP of whatever transform the part
 * computes to in its new layout, and released back to exactly that:
 *
 *     from: translate(dx, dy) scale(sx, sy) <computed>
 *       to: <computed>
 *
 * The deltas are between the two CENTRES, not the two top-left corners,
 * because the scale runs about the default `transform-origin` (the centre)
 * and a corner delta would double-count the size change.
 *
 * `key` is whatever changed the layout: a viewport tier, a view mode, a
 * page index. The hook animates only when it changes, never on mount.
 */
export interface ReformOptions {
  /**
   * Reads the key as it is RIGHT NOW, without waiting for React.
   *
   * Supply it and the resize refresh below can tell a within-tier drag
   * (refresh the snapshot) from the frame that actually crosses a
   * boundary (stand down — a reform is about to need that snapshot).
   * Leave it out and the refresh is skipped entirely, which is correct
   * but leaves the snapshot as old as the last render.
   */
  readKey?: () => string;
}

export function useReform(
  container: RefObject<HTMLElement | null>,
  key: string,
  options: ReformOptions = {},
): void {
  const previous = useRef<RectMap>(new Map());
  const lastKey = useRef<string | null>(null);

  // KEEPING THE "BEFORE" FRESH. A drag from 1600px to 1101px never
  // re-renders — the tier has not changed — so without this the snapshot
  // would still describe the 1600px layout when the drag finally crosses
  // 1100 and the parts would fly in from where they were half a second
  // ago. Re-measuring on `resize` keeps it at most one frame stale.
  //
  // The one frame it cannot cover is the crossing frame itself, where the
  // media query has already applied by the time any listener runs. That
  // degrades to deltas of zero — a reform that does not play — never to a
  // reform that plays from the wrong place.
  const readKey = options.readKey;
  const readKeyRef = useRef(readKey);
  readKeyRef.current = readKey;

  useLayoutEffect(() => {
    if (!readKeyRef.current) return;
    const onResize = () => {
      const root = container.current;
      const read = readKeyRef.current;
      if (!root || !read) return;
      // THE CROSSING FRAME. By the time any listener runs, the media
      // query has already applied and the DOM is in the NEW layout —
      // so refreshing here would overwrite the only record of where the
      // parts used to be, and the reform would compute deltas of zero and
      // play nothing. Measured, not theorised: it is exactly what an
      // instant resize did before this guard existed.
      if (read() !== lastKey.current) return;
      previous.current = measure(root).rects;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [container]);

  // No dependency array on purpose. The snapshot has to be refreshed after
  // EVERY commit, not only the ones that change `key` — a re-render that
  // repaginates the records without crossing a breakpoint would otherwise
  // leave a stale "before" behind for the next reform to invert against.
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;

    const { rects, parts } = measure(root);
    const before = previous.current;
    const changed = lastKey.current !== null && lastKey.current !== key;

    previous.current = rects;
    lastKey.current = key;

    if (!changed || before.size === 0 || prefersReducedMotion()) return;

    for (const el of parts) {
      const id = el.getAttribute(ID_ATTR);
      if (!id) continue;
      if (typeof el.animate !== "function") return; // jsdom, and old Safari

      const from = before.get(id);
      const to = rects.get(id);
      // A part with no box in one of the two layouts was born or died
      // there. It is faded by CSS, not flown by JS — see the doc's note on
      // why flying a born part in from off-canvas reads worse than a
      // cross-fade.
      if (!from || !to || from.width === 0 || to.width === 0) continue;

      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);

      const scales = el.getAttribute(SCALE_ATTR) !== "none";
      // Scaling a text block smears its type at every intermediate frame,
      // so type parts move without resizing. Shapes scale.
      const sx = scales ? from.width / to.width : 1;
      const sy = scales ? from.height / to.height : 1;

      const moved = Math.abs(dx) >= MOVE_EPSILON || Math.abs(dy) >= MOVE_EPSILON;
      const resized = Math.abs(sx - 1) >= SCALE_EPSILON || Math.abs(sy - 1) >= SCALE_EPSILON;
      if (!moved && !resized) continue;

      const computed =
        typeof window.getComputedStyle === "function"
          ? window.getComputedStyle(el).transform
          : "none";
      const base = computed && computed !== "none" ? ` ${computed}` : "";

      const rank = Number(el.getAttribute(RANK_ATTR) ?? 0) || 0;

      // Cancel any reform still in flight on this part. Without this a
      // fast drag across a breakpoint stacks animations and the last one
      // to finish wins, which is not always the current layout.
      for (const running of el.getAnimations()) {
        if (running.id === "reform") running.cancel();
      }

      const animation = el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})${base}` },
          { transform: base.trim() || "none" },
        ],
        {
          duration: REFORM_DURATION,
          delay: rank * REFORM_STAGGER,
          easing: REFORM_EASING,
          fill: "backwards",
        },
      );
      animation.id = "reform";
    }
  });
}
