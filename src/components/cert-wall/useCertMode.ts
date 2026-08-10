import { useEffect, useState } from "react";

export type CertMode = "wall-landscape" | "wall-portrait" | "ledger";

/**
 * Which composition the certificate module renders.
 *
 * Three regimes, and the boundary is a real rule rather than a taste call:
 *
 *   >= 768px, wide box  -> `wall-landscape`, 8/5 sheet, NEVER scrolls
 *   >= 768px, tall box  -> `wall-portrait`,  4/5 sheet, NEVER scrolls
 *   <  768px            -> `ledger`, the stacked register, scrolls
 *
 * 768px is the WCAG 1.4.10 reflow release `docs/05_ACCESSIBILITY.MD` already
 * treats as the point where the no-scroll rule yields — so scrolling begins
 * exactly where the accessibility rule permits it, and not one pixel sooner.
 *
 * This is JS rather than CSS because the LAYOUT LADDER differs per regime, not
 * just the styling. Rendering all three and hiding two with CSS would put
 * three copies of every certificate link in the accessibility tree, which is
 * the bug this project's own `NameRevealIntro` post-mortem warns about.
 *
 * Follows `useReducedMotion`'s shape: a `matchMedia` subscription with an
 * SSR/jsdom-safe default. The default is `wall-landscape` — the desktop case.
 */
const LEDGER_BELOW = 768;

function read(): CertMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "wall-landscape";
  }
  if (window.matchMedia(`(max-width: ${LEDGER_BELOW - 1}px)`).matches) return "ledger";
  // A tall box gets the portrait ladder — a tablet held upright, but also a
  // desktop window dragged narrow. Driven by the box's own shape, not by a
  // device guess.
  return window.matchMedia("(min-aspect-ratio: 1/1)").matches
    ? "wall-landscape"
    : "wall-portrait";
}

export function useCertMode(): CertMode {
  const [mode, setMode] = useState<CertMode>(read);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const queries = [
      window.matchMedia(`(max-width: ${LEDGER_BELOW - 1}px)`),
      window.matchMedia("(min-aspect-ratio: 1/1)"),
    ];
    const onChange = () => setMode(read());

    for (const q of queries) q.addEventListener("change", onChange);
    // Re-read once on mount: the first render used the SSR default.
    onChange();
    return () => {
      for (const q of queries) q.removeEventListener("change", onChange);
    };
  }, []);

  return mode;
}
