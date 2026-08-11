import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The wheel's own two states — CLOSED (a trigger button) and OPEN (the
 * radial list) — plus the two document-level keys that drive them. This
 * hook owns state and the keyboard; nothing about how either state looks.
 *
 * PROMOTED TO APP LEVEL (2026-08-11). The wheel used to be a Home-only gate:
 * it read `layerMounted` to stand down while a routed page was open, and
 * persisted "the user already opened this once" to `sessionStorage` so the
 * "Press Space" hint never nagged a second time. Both are gone now that the
 * trigger is a plain, always-visible icon button on every route — there is
 * no hint left to re-teach, so nothing needs remembering, and the wheel has
 * to work identically whether a page is open underneath it or not (that is
 * the entire point of promoting it out of `.shell`). `open` is ordinary,
 * non-persisted React state, and Space/Escape are live on every route.
 *
 * ESCAPE PRECEDENCE. `useTurnKeyboard` owns Escape/ArrowRight as "close the
 * open page." When the wheel is open on top of a page, the wheel has to
 * close first — `useTurnKeyboard` reads this hook's `open` value (via
 * `WheelContext`) and skips its own handling while it is true, rather than
 * this hook trying to guess whether a page is open underneath and racing a
 * second `document` listener for the same keypress.
 *
 * SPACE HAS ONE MEANING THAT ESCALATES: press it closed and the wheel
 * opens; press it open and the selection advances. Not two bindings — one,
 * whose effect depends on a state the trigger button is showing you.
 *
 * The document-level binding is the point: you should not have to hunt for
 * a focus target first. It bails on modifiers, and when focus sits on
 * something that already owns the key — otherwise it would double-fire
 * against the trigger button itself, which is a real `<button>` and
 * activates on Space natively.
 */

const KEY_OWNERS =
  "a[href], button, input, textarea, select, summary, [contenteditable], [role=button], [role=link]";

export interface WheelGate {
  /** True once the wheel is open. */
  open: boolean;
  /**
   * Whether the last transition came from a key rather than a pointer.
   * Read after `open` changes to decide whether to move focus: a pointer
   * user who taps the trigger should not get a focus ring under their
   * finger, and an unrequested focus move is the disorientation
   * `:focus-visible` exists to avoid.
   */
  viaKeyboard: { current: boolean };
  openGate: (viaKeyboard?: boolean) => void;
  closeGate: (viaKeyboard?: boolean) => void;
}

export interface UseWheelGateOptions {
  /** Called on Space while the wheel is already open. */
  onAdvance: () => void;
}

export function useWheelGate({ onAdvance }: UseWheelGateOptions): WheelGate {
  const [open, setOpen] = useState(false);
  const viaKeyboard = useRef(false);

  const openGate = useCallback((fromKey = false) => {
    viaKeyboard.current = fromKey;
    setOpen(true);
  }, []);

  const closeGate = useCallback((fromKey = false) => {
    viaKeyboard.current = fromKey;
    setOpen(false);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

      const target = event.target;
      const onAControl = target instanceof HTMLElement && !!target.closest(KEY_OWNERS);

      if (event.key === "Escape") {
        // Only meaningful when there is something to close.
        if (!open) return;
        event.preventDefault();
        closeGate(true);
        return;
      }

      if (event.key !== " " && event.code !== "Space") return;
      if (onAControl) return;
      event.preventDefault(); // Space would otherwise page-scroll
      if (open) onAdvance();
      else openGate(true);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeGate, onAdvance, open, openGate]);

  return { open, viaKeyboard, openGate, closeGate };
}
