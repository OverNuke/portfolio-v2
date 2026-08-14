import { useId, type ReactNode } from "react";
import "./turn.css";
import { useTurn } from "./useTurn";

export interface PageLayerProps {
  title: string;
  tag: string;
  children?: ReactNode;
}

/**
 * Task 2.4 (sdd/phase2-app-shell), design D3/D8/doc11 `PageLayer`. Single
 * persistent sheet — App.tsx (task 2.5) mounts/unmounts this using
 * `useTurn().layerMounted`, not local state.
 *
 * Two clip targets (design D3): the LAYER itself animates on
 * forward-home/reverse; on forward-page the layer's paper stays pinned
 * open (`data-turn="open"`) and only the inner `.page-content` wrapper
 * clips — this is what keeps Home from ever being revealed on a direct
 * page-to-page turn.
 *
 * `title`/`tag` are resolved by the caller from `ROUTES` against the
 * current route (design keeps `<Routes>` — and therefore route matching —
 * in App.tsx, "per the proposal"); this component owns only the
 * chrome (close control, `<h1>`, tag) and the two clip targets.
 *
 * D8: focus target is this component's own `<h1 tabindex="-1">`, not
 * anything inside the routed page content — `role="dialog" aria-modal
 * aria-labelledby` point at it.
 *
 * 2026-08-14: `.page-head` is visually hidden (not removed) across every
 * route — it still renders the BACK/ESC button and the `<h1>` this file's
 * D8 focus/aria-labelledby target depends on. Deleting the markup instead
 * of hiding it would drop the only Tab+Enter-reachable close control and
 * break the dialog's accessible name (CLAUDE.md: arrow-key shortcuts must
 * stay reachable via Tab+Enter too).
 */
export function PageLayer({ title, tag, children }: PageLayerProps) {
  const { turn, go, registerTitle } = useTurn();
  const titleId = useId();

  const layerTurn = turn === "forward-home" || turn === "reverse" ? turn : "open";
  const contentTurn = turn === "forward-page" ? "forward-page" : "open";

  return (
    <div
      className="page-layer"
      data-turn={layerTurn}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="page-head visually-hidden">
        <button type="button" className="page-close" onClick={() => go("/")}>
          <span aria-hidden="true">{"▶"}</span> BACK / ESC
        </button>
        <h1 id={titleId} className="page-title" tabIndex={-1} ref={registerTitle}>
          {title}
        </h1>
        <span className="page-tag">{tag}</span>
      </header>
      <div className="page-content" data-turn={contentTurn}>
        {children}
      </div>
    </div>
  );
}
