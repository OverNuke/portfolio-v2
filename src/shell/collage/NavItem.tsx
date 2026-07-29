import type { RouteConfig } from "../../routes/routes";
import { useTurn } from "../../turn/useTurn";

export interface NavItemProps {
  route: RouteConfig;
}

/**
 * Task 2.6 (sdd/phase2-app-shell), spec "NavItem is a `<button>`" + design
 * file layout (`src/shell/collage/NavItem.tsx`). A real `<button>`, not an
 * anchor/`<Link>` — doc 11 asserts both, but an anchor does not natively
 * activate on Space; spec #67 resolves the conflict in favor of the
 * component table + keyboard map, both of which assume native button
 * Space/Enter activation.
 *
 * Calls `go(route.path, event.currentTarget)` from `useTurn()` (task 2.4's
 * `TurnContext`) rather than `useNavigate()` directly. `go()` applies the
 * busy guard, captures the opener for the reverse turn's focus-return, and
 * drives the turn machine — it wraps `navigate()` internally, so real
 * react-router navigation still occurs (spec's underlying requirement),
 * just through the turn machine instead of bypassing it.
 *
 * `data-page={route.pageId}` is read by `useTurnKeyboard` (task 2.7) to
 * resolve "ArrowLeft at Home when the active element carries data-page" to
 * a route — ported from `docs/home.design-proof-v3.html`'s `data-page`
 * attribute on each `.nav-item` button.
 *
 * Markup mirrors the proof's `.nav-item` structure (index/label/sub/count)
 * minus the glitch-text effect (channel row/glitch layer is Phase 4, per
 * CLAUDE.md's doc table) and minus any `collage.css` placement class or
 * `plate` class — grid placement is task 3.1, explicitly out of scope
 * here.
 */
export function NavItem({ route }: NavItemProps) {
  const { go } = useTurn();

  return (
    <button
      type="button"
      className="nav-item"
      data-page={route.pageId}
      onClick={(event) => go(route.path, event.currentTarget)}
    >
      <span className="nav-index" aria-hidden="true">
        {route.index}
      </span>
      <span>
        <span className="nav-label" data-truncate="ellipsis">
          {route.title}
        </span>
        <span className="nav-sub" data-truncate="ellipsis">
          {route.sub}
        </span>
      </span>
      <span className="nav-count" aria-hidden="true">
        {route.count}
      </span>
    </button>
  );
}
