import { useTurn } from "../turn/useTurn";
import "./shell.css";

/**
 * Task 2.5 (sdd/phase2-app-shell), design "DOM sibling order & z bands":
 * a visually-hidden `role="status" aria-live="polite"` region reading
 * `useTurn().announcement` (set by `TurnProvider` on every settle — "PROFILE
 * module opened." / "PROFILE closed. Home."). MUST be composed as a DOM
 * SIBLING of the shell, never a descendant — App.tsx (this task) is
 * responsible for that placement; this component only owns the region
 * itself, same separation of concerns as `Crease`/`PageLayer` (task 2.4).
 */
export function Announcer() {
  const { announcement } = useTurn();
  return (
    <div className="visually-hidden" role="status" aria-live="polite">
      {announcement}
    </div>
  );
}
