import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import "./option-wheel.css";

/**
 * VENDORED — React Bits `<OptionWheel />`, JavaScript + CSS variant,
 * converted to TypeScript. Chosen for Home's module navigation
 * (`claude/home-three-directions-2026-08-10.md`, direction 01).
 *
 * The rAF loop, the exponential smoothing, the circle-radius maths
 * (`R = rowH / tiltRad`), the wheel/drag/click handling, the class names
 * and the `--ow-*` custom properties are upstream and UNCHANGED. Treat
 * this file as third-party: app concerns live in `ModuleWheel`, not here,
 * so this can be re-synced against a newer React Bits release by
 * re-applying only the list below.
 *
 * ── DEVIATIONS FROM UPSTREAM ─────────────────────────────────────────────
 *
 * 1. TYPES. `items` is `readonly string[]`; every prop is typed; the
 *    `style` object is cast once through `CSSProperties` because custom
 *    properties are not in React's `CSSProperties` index signature.
 *
 * 2. `aria-activedescendant` + per-option `id`s. Upstream ships a
 *    `role="listbox"` with `role="option"` children and no
 *    `aria-activedescendant`, so a screen reader on a focused listbox
 *    never learns which option is current. Required for AA.
 *
 * 3. ARROW AXIS. Upstream maps ArrowLeft/ArrowRight to prev/next as
 *    synonyms for Up/Down. This app cannot have that: `useTurnKeyboard`
 *    already owns ArrowLeft ("open the focused page") and ArrowRight
 *    ("close the open page") document-wide. `arrowAxis="vertical"` (the
 *    default here) binds Up/Down only and leaves the horizontal pair to
 *    the turn machine. Pass `"both"` to get upstream behaviour back.
 *
 * 4. `onActivate` + Enter. Upstream has no notion of committing a
 *    selection — `onChange` fires on every step, which for a navigation
 *    wheel would mean routing on every keypress. Selection and activation
 *    are separated: Enter, or a click on the ALREADY-selected option,
 *    calls `onActivate`. A click on any other option selects it, exactly
 *    as upstream.
 *
 * 5. Home / End jump to the first and last option.
 *
 * 6. `reducedMotion` prop. Upstream always eases and always blurs. When
 *    true, the smoothing constant drops to 1ms (an instant snap, not an
 *    animation) and per-step blur to 0. Passed in from the app's
 *    `useReducedMotion()` rather than read from `matchMedia` here, so the
 *    whole app answers the question in one place.
 *
 * 7. `rowH` recomputes on resize (upstream reads the root font size once
 *    at first render). Home changes the wheel's `fontSize` across
 *    breakpoints, and a stale row height desynchronises the layout from
 *    the hit targets.
 *
 * 8. `soundUrl`/`soundVolume` are NOT ported. No surface in this app plays
 *    audio, and a tick on navigation is exactly the kind of thing that
 *    ships once and is then removed. Re-add from upstream if wanted.
 *
 * 9. A `:focus-visible` ring in the CSS. Upstream sets `outline: none` on
 *    a `tabIndex={0}` element and gives nothing back.
 *
 * 10. AN IMPERATIVE HANDLE — `next()`, `prev()`, `select(i)` — through
 *    `forwardRef`. Upstream is uncontrolled and reads `defaultSelected`
 *    exactly once, at mount. That is fine when the wheel is the only thing
 *    driving itself, and wrong the moment something outside it can also
 *    move the selection: Home binds Space at the document, and pushing a
 *    new `defaultSelected` in does nothing, so the readout would step
 *    while the wheel sat still. Caught by the first end-to-end pass on the
 *    built app, not by the unit tests, which is why `Canvas.test.tsx` now
 *    asserts `aria-selected` moves rather than just the readout text.
 *
 *    A handle rather than a `value` prop on purpose: making it controlled
 *    would mean reconciling React's render cycle against a rAF loop that
 *    owns the same number, and the loop would win at 60fps. The wheel
 *    stays the source of truth; `onChange` mirrors it outward.
 *
 * 11. `textColor`/`activeColor` DEFAULT TO UNDEFINED, and an undefined
 *    prop emits no custom property at all. Upstream defaults them to
 *    `#a6a6a6`/`#ffffff` and always writes them into the inline `style`,
 *    where they beat any stylesheet — so `home.css` setting
 *    `--ow-active-color: var(--ink)` did nothing and the selected option
 *    rendered white on paper, i.e. invisible. Two hardcoded hexes also
 *    violate this repo's standing rule that `tokens.css` is the only
 *    place a colour is written down. Leaving them unset lets the CSS own
 *    the skin; pass them explicitly if a caller really wants inline.
 *
 * 12. `onMouseDown={(e) => e.preventDefault()}` on each item. Upstream
 *    items carry no `tabindex`, so a click still moves DOM focus to the
 *    nearest focusable ancestor (`.option-wheel`, `tabindex="0"`) —
 *    showing the keyboard `:focus-visible` ring for an ordinary mouse
 *    click, since a `<div>`-based listbox doesn't get the same
 *    click-suppresses-the-ring treatment a native control would.
 *    Suppressing the default focus shift on `mousedown` leaves `onClick`
 *    (selection/activation) untouched.
 *
 * ── KNOWN UPSTREAM QUIRK, deliberately preserved ─────────────────────────
 * With `loop`, the internal target grows without bound as you keep
 * advancing — it is never reduced modulo `count`. It is only ever used as
 * a delta and as `Math.round(v) % count`, so nothing breaks; it is why the
 * selected index is read through the modulo and not off the raw target.
 */

export interface OptionWheelProps {
  items: readonly string[];
  defaultSelected?: number;
  onChange?: (index: number, item: string) => void;
  /** Deviation 4. Fired by Enter, or by clicking the selected option. */
  onActivate?: (index: number, item: string) => void;
  /** Deviation 11. Unset means "leave it to the stylesheet". */
  textColor?: string;
  /** Deviation 11. */
  activeColor?: string;
  side?: "left" | "right";
  /** rem */
  fontSize?: number;
  /** multiple of fontSize */
  spacing?: number;
  curve?: number;
  /** degrees between neighbouring options */
  tilt?: number;
  /** px of blur added per step away from the middle */
  blur?: number;
  /** opacity lost per step away from the middle */
  fade?: number;
  minOpacity?: number;
  /** easing time constant, ms */
  smoothing?: number;
  /** px between the anchored edge and the centred option */
  inset?: number;
  loop?: boolean;
  draggable?: boolean;
  /** Deviation 3. */
  arrowAxis?: "vertical" | "both";
  /** Deviation 6. */
  reducedMotion?: boolean;
  ariaLabel?: string;
  /** Read by `useTurnKeyboard` to resolve ArrowLeft to a route. */
  dataPage?: string;
  className?: string;
}

/** Deviation 10. */
export interface OptionWheelHandle {
  next(): void;
  prev(): void;
  select(index: number): void;
  selected(): number;
}

interface Config {
  count: number;
  items: readonly string[];
  rowH: number;
  curve: number;
  tilt: number;
  blur: number;
  fade: number;
  minOpacity: number;
  side: "left" | "right";
  loop: boolean;
  smoothing: number;
  draggable: boolean;
}

function rootFontSize(): number {
  if (typeof window === "undefined") return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

export const OptionWheel = forwardRef<OptionWheelHandle, OptionWheelProps>(function OptionWheel(
  {
    items,
    defaultSelected = 0,
  onChange,
  onActivate,
    textColor,
    activeColor,
  side = "left",
  fontSize = 3,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.25,
  minOpacity = 0.05,
  smoothing = 200,
  inset = 80,
  loop = false,
  draggable = true,
  arrowAxis = "vertical",
  reducedMotion = false,
    ariaLabel = "Options",
    dataPage,
    className = "",
  }: OptionWheelProps,
  handle,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const posRef = useRef(defaultSelected);
  const targetRef = useRef(defaultSelected);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const cfgRef = useRef<Config>({} as Config);
  const onChangeRef = useRef(onChange);
  const onActivateRef = useRef(onActivate);
  const selectedRef = useRef(defaultSelected);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ y: number; start: number; id: number } | null>(null);
  const dragMovedRef = useRef(false);

  const [selectedIndex, setSelectedIndex] = useState(defaultSelected);
  const [isDragging, setIsDragging] = useState(false);
  // Deviation 7: re-read on resize rather than once at first render.
  const [remPx, setRemPx] = useState(rootFontSize);

  const uid = useRef(`ow-${Math.random().toString(36).slice(2, 8)}`).current;

  onChangeRef.current = onChange;
  onActivateRef.current = onActivate;

  cfgRef.current = {
    count: items.length,
    items,
    rowH: Math.max(fontSize * spacing * remPx, 1),
    curve,
    tilt,
    // Deviation 6.
    blur: reducedMotion ? 0 : blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing: reducedMotion ? 1 : smoothing,
    draggable,
  };

  useEffect(() => {
    function onResize() {
      setRemPx(rootFontSize());
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Single rAF loop that eases the wheel position toward its target with
  // frame-rate independent exponential smoothing, then lays every option out
  // along the curve based on its distance from the current position.
  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const cfg = cfgRef.current;
    const tau = Math.max(cfg.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);
    const target = targetRef.current;
    const cur = posRef.current;
    let next = cur + (target - cur) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    posRef.current = next;

    const els = itemRefs.current;
    const n = cfg.count;
    const mirror = cfg.side === "right" ? -1 : 1;
    // Options sit on a circle whose radius keeps the arc length between two
    // neighbors equal to one row height, so tilt controls how tightly it curls.
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;

    for (let i = 0; i < n; i++) {
      const el = els[i];
      if (!el) continue;
      let d = i - next;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * cfg.rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
      el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : "none";
      el.style.setProperty("--ow-p", Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }
    rafRef.current = settled ? null : requestAnimationFrame(runFrame);
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const applyTarget = useCallback(
    (value: number, snap: boolean) => {
      const cfg = cfgRef.current;
      let v = value;
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
      if (snap) v = Math.round(v);
      targetRef.current = v;
      const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
      if (idx !== selectedRef.current) {
        selectedRef.current = idx;
        setSelectedIndex(idx);
        onChangeRef.current?.(idx, cfg.items[idx]);
      }
      startLoop();
    },
    [startLoop],
  );

  // Wheel / touchpad scrolling, registered manually so it can be non-passive.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const cfg = cfgRef.current;
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      // Cap each event at one step so notchy mouse wheels move exactly one
      // option per click, while touchpads still scroll continuously.
      const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
      applyTarget(targetRef.current + step, false);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => applyTarget(targetRef.current, true), 140);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [applyTarget]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cfgRef.current.draggable) return;
    dragRef.current = { y: e.clientY, start: targetRef.current, id: e.pointerId };
    dragMovedRef.current = false;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = e.clientY - drag.y;
      if (!dragMovedRef.current && Math.abs(dy) > 4) {
        dragMovedRef.current = true;
        // Capture only once a real drag starts, so plain clicks still reach
        // the items and navigate to them.
        rootRef.current?.setPointerCapture(drag.id);
      }
      if (dragMovedRef.current) applyTarget(drag.start - dy / cfgRef.current.rowH, false);
    },
    [applyTarget],
  );

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) applyTarget(targetRef.current, true);
    // Cleared asynchronously so the click that follows this pointerup is
    // still suppressed when the gesture was a drag.
    setTimeout(() => {
      dragMovedRef.current = false;
    }, 0);
  }, [applyTarget]);

  const handleItemClick = useCallback(
    (index: number) => {
      if (dragMovedRef.current) return;
      const cfg = cfgRef.current;
      // Deviation 4: clicking the option that is already selected commits it.
      if (index === selectedRef.current) {
        onActivateRef.current?.(index, cfg.items[index]);
        return;
      }
      const cur = targetRef.current;
      let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
      if (cfg.loop && cfg.count > 1) {
        if (d > cfg.count / 2) d -= cfg.count;
        else if (d < -cfg.count / 2) d += cfg.count;
      }
      applyTarget(cur + d, true);
    },
    [applyTarget],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const cfg = cfgRef.current;
        onActivateRef.current?.(selectedRef.current, cfg.items[selectedRef.current]);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        applyTarget(0, true);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        applyTarget(cfgRef.current.count - 1, true);
        return;
      }
      let delta: number | null = null;
      if (e.key === "ArrowUp") delta = -1;
      else if (e.key === "ArrowDown") delta = 1;
      else if (arrowAxis === "both" && e.key === "ArrowLeft") delta = -1;
      else if (arrowAxis === "both" && e.key === "ArrowRight") delta = 1;
      if (delta == null) return;
      e.preventDefault();
      applyTarget(Math.round(targetRef.current) + delta, true);
    },
    [applyTarget, arrowAxis],
  );

  useEffect(() => {
    applyTarget(targetRef.current, false);
  }, [
    items,
    fontSize,
    spacing,
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing,
    remPx,
    reducedMotion,
    applyTarget,
  ]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  // Deviation 10.
  useImperativeHandle(
    handle,
    () => ({
      next: () => applyTarget(Math.round(targetRef.current) + 1, true),
      prev: () => applyTarget(Math.round(targetRef.current) - 1, true),
      select: (index: number) => applyTarget(index, true),
      selected: () => selectedRef.current,
    }),
    [applyTarget],
  );

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-activedescendant={`${uid}-${selectedIndex}`}
      data-page={dataPage}
      className={`option-wheel${side === "right" ? " option-wheel--right" : ""}${
        isDragging ? " option-wheel--dragging" : ""
      }${className ? ` ${className}` : ""}`}
      style={
        {
          // Deviation 11: an unset colour emits no property, so the
          // stylesheet's value survives instead of being shadowed by an
          // inline default.
          ...(textColor ? { "--ow-text-color": textColor } : null),
          ...(activeColor ? { "--ow-active-color": activeColor } : null),
          "--ow-font-size": `${fontSize}rem`,
          "--ow-inset": `${inset}px`,
        } as React.CSSProperties
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => (
        /*
         * The two rules disabled here both assume every interactive role
         * is its own tab stop. This is the `aria-activedescendant`
         * listbox pattern instead: the LISTBOX is the single tab stop and
         * owns the keyboard (Up/Down to move, Enter to activate, Home/End
         * to jump), and the options are announced through
         * `aria-activedescendant` without ever taking focus themselves.
         * Making each option focusable would put four extra stops in the
         * tab order for one control, which is the thing the pattern
         * exists to avoid. The click handler's keyboard equivalent is
         * Enter on the parent — present, just not on this element.
         */
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
        <div
          key={`${label}-${index}`}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          id={`${uid}-${index}`}
          role="option"
          aria-selected={selectedIndex === index}
          className={`option-wheel__item${
            selectedIndex === index ? " option-wheel__item--selected" : ""
          }`}
          // Deviation 12: an item has no `tabindex` of its own, so a click
          // on it would otherwise still move DOM focus to the nearest
          // focusable ancestor (`.option-wheel`, `tabindex="0"`) — showing
          // the keyboard focus ring for a plain mouse click. `preventDefault`
          // on `mousedown` suppresses that default focus shift without
          // touching `onClick`, so selection/activation is unaffected.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleItemClick(index)}
        >
          {label}
        </div>
      ))}
    </div>
  );
});
