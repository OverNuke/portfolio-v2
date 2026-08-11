import { useSyncExternalStore } from "react";

/**
 * Generalised sibling of `useReducedMotion` — same `useSyncExternalStore`
 * over `matchMedia` shape, same feature detection so it never throws in an
 * environment without `matchMedia` (jsdom 25 has none).
 *
 * Added 2026-08-10 with the editorial Home. It exists for exactly one
 * reason: `OptionWheel`'s row height is derived from its `fontSize` prop,
 * so the wheel has to be told the breakpoint in JS rather than restyled in
 * CSS. Resist using it for anything a media query can already do — layout
 * belongs in `home.css` (design D5), and a component that branches on
 * viewport width in TypeScript is a component that will disagree with the
 * stylesheet eventually.
 *
 * `useReducedMotion` stays as its own file rather than becoming
 * `useMediaQuery("(prefers-reduced-motion: reduce)")` at every call site:
 * it is a named concept the status bar and the turn machine both read, and
 * the query string should be written once.
 */
export function useMediaQuery(query: string): boolean {
  function getSnapshot(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(query).matches;
  }

  function subscribe(callback: () => void): () => void {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return () => {};
    }
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
