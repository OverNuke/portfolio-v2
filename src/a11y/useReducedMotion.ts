import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// jsdom's matchMedia stub (src/test/setup.ts) always reports `matches: false`
// with no-op listeners; tests override window.matchMedia per-case (D15/R2).
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export type MotionState = "static" | "animated";

// The concrete `data-motion` DOM observable every Tier-A layer must expose
// (R2) — Ink Flow, Profile living cells, Distinction breathe, Contact wobble.
export function motionAttr(reduced: boolean): MotionState {
  return reduced ? "static" : "animated";
}
