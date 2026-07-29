import { useEffect } from "react";
import { ROUTES } from "../routes/routes";
import { useTurn } from "./useTurn";

/**
 * Task 2.7 (sdd/phase2-app-shell), design "Page-turn Flow" > Keyboard
 * (document-level):
 * - `Escape` / `ArrowRight` while a page is open -> `go("/")` (same
 *   reverse-turn code path as the close control).
 * - `ArrowLeft` at Home when `document.activeElement` carries `data-page`
 *   -> open that page, passing the active element itself as the opener so
 *   the reverse turn later returns focus to it (mirrors NavItem's own
 *   `go(route.path, event.currentTarget)` call, task 2.6).
 * - Ignored entirely when the event target is `input`/`textarea`/
 *   contenteditable, or any modifier key (Ctrl/Alt/Meta/Shift) is held —
 *   no text inputs exist in Phase 2 (the Contact terminal is later), but
 *   the guard is written defensively per design's explicit note.
 * - `Tab`/`Shift+Tab` are never remapped — this hook does not listen for
 *   them at all.
 *
 * Attached once at `document` level (not per-element) via a `keydown`
 * listener, cleaned up on unmount — mirrors the "one imperative driver"
 * precedent `TurnProvider`'s `useLayoutEffect` set in task 2.4.
 */
export function useTurnKeyboard(): void {
  const { go, layerMounted } = useTurn();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }

      if (layerMounted) {
        if (event.key === "Escape" || event.key === "ArrowRight") {
          event.preventDefault();
          go("/");
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) return;
        const pageId = active.getAttribute("data-page");
        if (!pageId) return;
        const route = ROUTES.find((r) => r.pageId === pageId);
        if (!route) return;
        event.preventDefault();
        go(route.path, active);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [go, layerMounted]);
}
