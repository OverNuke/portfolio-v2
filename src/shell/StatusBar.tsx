import { useReducedMotion } from "./useReducedMotion";
import "./shell.css";

/**
 * Task 2.5 (sdd/phase2-app-shell), design z-index table + doc11/proof
 * `.status-bar` `#motion-state`. Minimal port: the live motion-state
 * readout only (keyboard legend / A11y badge / node label are Phase 4's
 * glitch-text chrome, out of scope here). Deliberately NOT `role="status"`/
 * `aria-live` — that would create a second live region competing with
 * `Announcer` (design: Announcer is the one aria-live surface).
 */
export function StatusBar() {
  const reducedMotion = useReducedMotion();
  return (
    <footer className="status-bar">
      <span className="status-ok">{reducedMotion ? "MOTION: REDUCED" : "MOTION: FULL"}</span>
    </footer>
  );
}
