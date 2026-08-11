import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { OptionWheel, type OptionWheelHandle } from "../../components/option-wheel";
import type { RouteConfig } from "../../routes/routes";
import { useReducedMotion } from "../useReducedMotion";
import { useMediaQuery } from "../useMediaQuery";
import { useTurn } from "../../turn/useTurn";
import { useWheelGate } from "./useWheelGate";
import { useSetWheelOpen } from "./WheelContext";
import "./wheel.css";

export interface ModuleWheelProps {
  modules: readonly RouteConfig[];
}

/**
 * The site's navigation, everywhere. In two states, in the middle of the
 * two directional-ish things it is not: not a Home decoration (it is a DOM
 * sibling of `Shell`/`PageLayer` — see `App.tsx` — so nothing that marks
 * `.shell` inert while a page is open can reach it), and not a modal (no
 * `aria-modal`, no focus trap; every module stays reachable while it's
 * open, same as before promotion).
 *
 * ── CLOSED ───────────────────────────────────────────────────────────────
 * A fixed, always-visible icon button — no onboarding copy, nothing to
 * "learn" first (2026-08-11, promoted-to-global pass: dropped the
 * `sessionStorage`-backed "Press Space" gate this replaced — see
 * `useWheelGate`'s own header for why). Space still opens it as a shortcut
 * on top of the button; the button is what makes it a real, discoverable
 * nav control everywhere, including on a coarse pointer with no keyboard
 * hint to show.
 *
 * ── OPEN ─────────────────────────────────────────────────────────────────
 *   Space          next module            (document level, primary)
 *   Up / Down      previous / next        (wheel focused)
 *   Scroll         previous / next        (`OptionWheel`'s own wheel/touch
 *                  listener — works over the panel with no focus needed)
 *   Enter          commit the selected module
 *   Escape         back to the trigger — closes the wheel FIRST even if a
 *                  page is open underneath (`useTurnKeyboard` defers to
 *                  `WheelContext`'s `open` for exactly this)
 *   ArrowLeft      commit, at Home only — NOT handled here. The wheel
 *                  carries `data-page`; `useTurnKeyboard`'s existing
 *                  "ArrowLeft at Home opens the focused page" rule picks it
 *                  up unchanged.
 *   Click          selects; clicking the selected option commits it
 *   Touch          a small control advances; tapping the centred label opens
 *
 * ArrowRight is deliberately absent: `useTurnKeyboard` owns it as "close
 * the open page." `arrowAxis="vertical"`.
 *
 * ── FLOATING, NOT BOXED (2026-08-11, editorial-index pass) ───────────────
 * Three independently positioned regions over the backdrop, not one panel
 * holding all three: `.wheel-readout` (the description — the leading
 * element, more visual weight than the control per the brief), `.wheel-nav`
 * (the wheel, right-anchored and vertically centered), `.wheel-keys` (the
 * hints, bottom-center, low-contrast). None of them share a box, so none of
 * them can ever reflow another — not a min-height reservation this time
 * (the previous pass's fix for the same class of problem), just genuine
 * positional independence.
 *
 * `.wheel-nav` looks unboxed but `.option-wheel` underneath it still has an
 * explicit size — every `.option-wheel__item` is `position: absolute`
 * (`OptionWheel.tsx`), so an absolutely-positioned child contributes
 * nothing to a parent's intrinsic `auto`/`max-content` size; setting THAT
 * element to `auto`/`max-content` collapses it to zero and breaks the
 * `top: 50%` reference point the whole arc is built on. `.wheel-nav` itself
 * (one level up, wrapping a normally-flowed child) is what gets the
 * intrinsic `max-content` sizing — safe there, and it's what makes the
 * wheel read as "only as big as it needs to be" rather than a component
 * filling a fixed frame.
 *
 * ── EVERY COMMIT IS EXPLICIT (2026-08-11) ─────────────────────────────────
 * Turning the wheel — by scroll, arrow key, or Space — only swaps the
 * preview; `go()` is never called on every step (it carries a busy guard
 * and drives a 200ms turn, so routing on every step would fire four
 * navigations to walk from Profile to Contact). This used to settle into an
 * automatic navigation on desktop ~450ms after the selection stopped
 * moving; dropped, because the wheel can now be opened on top of an
 * already-open page, where a stray auto-navigate mid-browse is actively
 * hostile, not just noisy. Committing is now uniformly Enter, or a second
 * click on the already-selected option, on every breakpoint.
 *
 * ── CLOSES ON NAVIGATE ────────────────────────────────────────────────────
 * Nothing here calls `closeGate()` from `activate()` directly — instead
 * `open` resets whenever the ROUTE actually changes (the `useLocation`
 * effect below), which covers `go()`-driven navigation, browser back/
 * forward, and any future nav entry point uniformly, rather than patching
 * every call site that might navigate.
 */
export function ModuleWheel({ modules }: ModuleWheelProps) {
  const { go } = useTurn();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isMobile = useMediaQuery("(max-width: 640px)");
  const coarsePointer = useMediaQuery("(pointer: coarse)");

  const zoneRef = useRef<HTMLDivElement | null>(null);
  const wheelRef = useRef<OptionWheelHandle | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  // Owned here now, not lifted to a parent: the readout/lede below is the
  // only outside consumer this ever had (via `Canvas`'s old caption rail),
  // and it moved into this panel with the rest of the wheel.
  const [selected, setSelected] = useState(0);

  const labels = modules.map((route) => route.short);

  /**
   * Drives the WHEEL, and lets the wheel's own `onChange` drive `selected`
   * back out. The wheel is uncontrolled by design (a rAF loop owns the
   * position; React re-renders would fight it), so pushing a new
   * `defaultSelected` in does nothing.
   */
  const advance = useCallback(() => {
    wheelRef.current?.next();
  }, []);

  const { open, viaKeyboard, openGate, closeGate } = useWheelGate({ onAdvance: advance });

  const setWheelOpen = useSetWheelOpen();
  useEffect(() => {
    setWheelOpen(open);
  }, [open, setWheelOpen]);

  // Close whenever the route actually changes — covers go()-driven
  // navigation, browser back/forward, and deep links alike, rather than
  // calling closeGate() from every place that might navigate.
  useEffect(() => {
    closeGate();
  }, [location.pathname, closeGate]);

  // Focus follows the state, but only for keyboard transitions — a pointer
  // user who taps the trigger should not get a focus ring under their
  // finger.
  useEffect(() => {
    if (!viaKeyboard.current) return;
    viaKeyboard.current = false;
    const target = open
      ? zoneRef.current?.querySelector<HTMLElement>(".option-wheel")
      : triggerRef.current;
    target?.focus();
  }, [open, viaKeyboard]);

  const activate = useCallback(
    (index: number) => {
      const route = modules[index];
      if (!route) return;
      // The opener is the wheel, not the option: options are recycled divs
      // whose transforms move every frame, and the reverse turn needs
      // somewhere stable to put focus back.
      go(route.path, zoneRef.current?.querySelector<HTMLElement>(".option-wheel") ?? null);
    },
    [go, modules],
  );

  const fontSize = isMobile ? 1.6 : isTablet ? 1.95 : 2.5;
  const activeModule = modules[selected] ?? modules[0];

  return (
    <div className="wheel" ref={zoneRef} data-open={open ? "true" : "false"}>
      {open ? (
        <>
          {/* Not a modal (no aria-modal, no focus trap) — purely the "click
              outside to dismiss" affordance a floating field over a
              blurred backdrop implies. No `fromKey`: this is the pointer
              path, matching the trigger's own `onClick={() => openGate()}`,
              so it doesn't trigger the keyboard-only focus-restoration
              effect above. A sibling of the three regions below, not an
              ancestor — `wheel.css` stacks each of them above it with an
              explicit z-index. */}
          <div className="wheel-backdrop" aria-hidden="true" onClick={() => closeGate()} />

          {/* The editorial description — the LEADING element (2026-08-11,
              floating-index pass): more visual weight than the wheel
              itself, per the brief. Independently positioned (not a
              sibling in a shared row/column with the wheel), so its own
              height changing as the lede's length changes can never move
              the wheel — the two only ever share the viewport, not a box. */}
          {activeModule && (
            <div className="wheel-readout">
              <p className="wheel-readout__meta">
                <span className="wheel-readout__idx">{activeModule.index}</span>
                <span className="wheel-readout__sub">{activeModule.sub}</span>
              </p>
              <p className="wheel-readout__title">{activeModule.title}</p>
              <p className="wheel-lede">{activeModule.lede}</p>
            </div>
          )}

          {/* The wheel — the CONTROL, secondary to the description above.
              `.wheel-nav` is the only wrapper `OptionWheel` sits inside;
              it's intrinsically sized (`width/height: max-content` in
              wheel.css) around `.option-wheel`'s own explicit box, not
              forced to fill a parent — see wheel.css's header for why
              `.option-wheel` itself still needs an explicit size despite
              that (its children are all `position: absolute`, so `auto`/
              `max-content` on IT would collapse to zero). */}
          <div className="wheel-nav">
            <OptionWheel
              key={fontSize}
              ref={wheelRef}
              items={labels}
              defaultSelected={selected}
              onChange={setSelected}
              onActivate={activate}
              arrowAxis="vertical"
              reducedMotion={reducedMotion}
              ariaLabel="Portfolio modules"
              dataPage={activeModule?.pageId}
              side="right"
              fontSize={fontSize}
              spacing={1.35}
              tilt={7}
              curve={1.1}
              blur={2.2}
              fade={0.16}
              // Computed, not guessed: paper-white text at this opacity is
              // the lowest that still clears 4.5:1 against the worst
              // realistic case — the backdrop composited over a light
              // routed page (e.g. /profile's paper half), not just Home's.
              // The "recedes into the distance" read comes from `blur`
              // above instead, which isn't part of the contrast
              // calculation — a blurred-but-full-contrast label is legal;
              // a faint-but-sharp one that dips under 0.72 is not.
              minOpacity={0.72}
              inset={40}
              loop
            />

            {/* Rendered, not hidden with `display: none` —
                `scripts/audit.mjs` measures every control in the DOM and a
                hidden button reports as a 0x0 target occluded by whatever
                is painted over it. On a fine pointer, scroll/Space are
                sufficient and the frame stays clean. */}
            {coarsePointer && (
              <button className="wheel-advance" type="button" onClick={advance}>
                <span className="visually-hidden">Next module</span>
              </button>
            )}
          </div>

          <p className="wheel-keys" aria-hidden="true">
            Scroll or <kbd>Space</kbd> next · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close
          </p>
        </>
      ) : (
        <button
          className="wheel-trigger"
          type="button"
          ref={triggerRef}
          onClick={() => openGate()}
          aria-label="Open navigation"
        >
          <span className="wheel-trigger__icon" aria-hidden="true" />
        </button>
      )}

      <p className="visually-hidden" role="status" aria-live="polite">
        {open && activeModule
          ? `${activeModule.title}, module ${selected + 1} of ${modules.length}`
          : ""}
      </p>
    </div>
  );
}
