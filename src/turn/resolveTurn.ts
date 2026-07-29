/**
 * Task 2.3 (sdd/phase2-app-shell), design D3/interfaces.
 *
 * Turn direction is a pure function of the destination route only (spec
 * "Turn direction is a pure function of destination route"): it never
 * depends on history stack, opener, or anything but the two paths.
 *
 * `displayedPath` is what the PageLayer is CURRENTLY showing (updated only
 * once a turn settles) — it deliberately diverges from `location.pathname`
 * for the duration of a turn. `displayedPath` seeds to "/", so a deep link
 * to e.g. "/skills" resolves "forward-home" on first paint, satisfying the
 * spec's "applies uniformly to ... deep-link initial loads" requirement.
 */
export type Turn = "none" | "forward-home" | "forward-page" | "reverse";

export function resolveTurn(displayedPath: string, nextPath: string): Turn {
  if (displayedPath === nextPath) return "none";
  if (nextPath === "/") return "reverse";
  return displayedPath === "/" ? "forward-home" : "forward-page";
}
