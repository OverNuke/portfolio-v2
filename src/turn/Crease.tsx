import "./turn.css";
import { useTurn } from "./useTurn";

/**
 * Task 2.4 (sdd/phase2-app-shell), doc11 `Crease` / design "Page-turn
 * Flow": a 2px Ink vertical line animating `left` in lockstep with the
 * layer's clip-path. Purely presentational — reads `turn` straight from
 * context, no props. Hidden entirely under reduced motion (turn.css media
 * query) and hidden by default whenever no turn is in flight
 * (`data-turn="none"` / resting).
 */
export function Crease() {
  const { turn } = useTurn();
  return <div className="crease" data-turn={turn} aria-hidden="true" />;
}
