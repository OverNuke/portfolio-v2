import { useEffect, type RefObject } from "react";

/**
 * Task 2.3 (sdd/phase2-app-shell), design D4: React 18 ships no `inert`
 * prop, no `el.inert` property support in jsdom, and this project adds no
 * global JSX type augmentation for it. `setInert` is the imperative
 * workaround — it sets/removes the `inert` ATTRIBUTE and `aria-hidden` as
 * one paired operation so a subtree is never left half-hidden (an element
 * with `inert` but no `aria-hidden` still leaks into some AT tree walks in
 * older engines; pairing them is the belt-and-suspenders approach docs
 * 11/12 and design D4 call for).
 */
export function setInert(el: HTMLElement, on: boolean): void {
  if (on) {
    el.setAttribute("inert", "");
    el.setAttribute("aria-hidden", "true");
  } else {
    el.removeAttribute("inert");
    el.removeAttribute("aria-hidden");
  }
}

/**
 * Hook wrapper around `setInert`. Applies (or clears) inert+aria-hidden on
 * the ref target whenever `on` changes, and always clears both on unmount
 * so a component that goes away mid-turn never leaves a stray inert node
 * behind in the DOM.
 */
export function useInert(ref: RefObject<HTMLElement | null>, on: boolean): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setInert(el, on);

    return () => setInert(el, false);
  }, [ref, on]);
}
