import { createContext, useContext } from "react";
import type { Turn } from "./resolveTurn";

/**
 * Task 2.4 (sdd/phase2-app-shell), design's Interfaces section defines
 * `TurnContext` minimally as `{ busy: boolean; go(path, opener?): void }`.
 * That minimal shape is not enough to build `PageLayer`/`Crease` (they need
 * `turn` for the `data-turn` attribute, `displayedPath` for App.tsx's
 * `contentLocation` calc per design, `layerMounted` for the "layer is
 * already in the DOM, merely clipped" invariant the flow depends on, and a
 * way to attach the shell/title DOM nodes `TurnProvider` manipulates
 * imperatively). Extended here; documented as a deviation for sdd-verify,
 * same pattern as Panel's `content` vs `children` note.
 *
 * `registerShell`/`registerTitle` are callback refs (not raw `RefObject`s)
 * so any host element type can attach them directly via `ref={registerShell}`
 * without TypeScript's `RefObject<T>` invariance fighting the caller.
 */
export interface TurnContextValue {
  busy: boolean;
  turn: Turn;
  displayedPath: string;
  layerMounted: boolean;
  announcement: string;
  go(path: string, opener?: HTMLElement | null): void;
  registerShell(el: HTMLElement | null): void;
  registerTitle(el: HTMLHeadingElement | null): void;
}

export const TurnContext = createContext<TurnContextValue | null>(null);

export function useTurn(): TurnContextValue {
  const ctx = useContext(TurnContext);
  if (!ctx) {
    throw new Error("useTurn must be used within a TurnProvider");
  }
  return ctx;
}
