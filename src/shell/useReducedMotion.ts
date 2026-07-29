import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

/**
 * Task 2.5 (sdd/phase2-app-shell), design's file layout (`shell/useReducedMotion.ts`)
 * and batch 3's flag: the shared, canonical `prefers-reduced-motion` reader —
 * `TurnProvider`'s local inline `prefersReducedMotion()` check (task 2.4) is
 * replaced by this hook this batch, and `StatusBar` reads it for its live
 * "MOTION: FULL"/"MOTION: REDUCED" readout (design "Reduced motion" /
 * doc11 status-bar `#motion-state`).
 *
 * `useSyncExternalStore` over `matchMedia`'s `change` event, feature-detected
 * so it never throws in an environment without `matchMedia` (jsdom 25 has
 * none — same guard TurnProvider's local check used).
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
