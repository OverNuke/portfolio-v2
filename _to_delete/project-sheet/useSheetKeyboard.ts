import { useEffect } from "react";

export interface SheetKeyboardOptions {
  /** Called for ArrowLeft when a next sheet exists. */
  onForward?: () => void;
  /** Called for ArrowRight when a previous sheet exists. */
  onBack?: () => void;
}

/**
 * Sheet-to-sheet paging on the /projects module, layered under the shell's
 * own page-turn keys WITHOUT redefining them.
 *
 * docs/05_ACCESSIBILITY.MD already binds Left = forward and Right = back.
 * Paging between sheets is just those two words with more than one step to
 * unwind, so this hook adds no new binding — it only gets first refusal on
 * the two keys the shell already owns:
 *
 *   Left   next sheet, if there is one    else falls through (does nothing)
 *   Right  previous sheet, if on 2+       else falls through -> Home
 *   Esc    never handled here             always falls through -> Home
 *
 * Escape is the deliberate asymmetry: Right unwinds one sheet at a time,
 * Escape exits the module outright. Someone on sheet 5 should not have to
 * press Right five times to leave.
 *
 * MECHANISM — read this before changing it. `useTurnKeyboard` listens on
 * `document` in the BUBBLE phase. This hook listens on `document` in the
 * CAPTURE phase, which runs first, and calls `stopPropagation()` ONLY when
 * it actually handles the key. That ordering is the whole design: it means
 * the fall-through cases above are automatic rather than duplicated here,
 * so there is exactly one implementation of "Right closes the page" and
 * this hook cannot drift from it.
 *
 * If it handled a key it had nothing to do with, Right would stop closing
 * the page — which is why every branch is guarded on a handler existing.
 */
export function useSheetKeyboard({ onForward, onBack }: SheetKeyboardOptions): void {
  useEffect(() => {
    if (!onForward && !onBack) return;

    function onKeyDown(event: KeyboardEvent) {
      // Same guards as useTurnKeyboard, for the same reasons: never fight a
      // text field, never hijack a modified chord, never touch Tab.
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }

      const handler =
        event.key === "ArrowLeft" ? onForward : event.key === "ArrowRight" ? onBack : undefined;
      if (!handler) return;

      event.preventDefault();
      event.stopPropagation();
      handler();
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onForward, onBack]);
}
