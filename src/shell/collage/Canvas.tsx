import { ROUTES } from "../../routes/routes";
import { NavItem } from "./NavItem";
import "./collage.css";

/**
 * Task 3.1 (sdd/phase2-app-shell), design "Collage Canvas" section. The
 * 12x12 grid container (`.canvas`), composed inside `Shell.tsx`'s existing
 * `<main id="main-content">`. Wraps the identity content (previously
 * inline in `Shell.tsx`, batch 5 — moved here so it can be placed as a
 * grid plate), the real NavItem list (task 2.6), and a placeholder
 * spec-cascade plate.
 *
 * ALL placement (grid-area, rotation, z-index, stagger, breakpoints)
 * lives in `collage.css` (design D5 — that file is the single placement
 * source of truth). This component applies class names only — never an
 * inline style, never a pixel `top`/`left`.
 *
 * The spec-cascade plate is a Phase-2 placeholder: no real spec/status
 * content is wired yet (that's Phase 3/4 module content, out of scope per
 * proposal #65), so it is `aria-hidden` — doc 12's rule that a plate
 * carrying no real, unique information must never be presented to
 * assistive tech as authoritative content.
 */
export function Canvas() {
  return (
    <div className="canvas">
      <div className="identity-plate">
        <p className="eyebrow">— portfolio / unit 001 —</p>
        <h1 className="identity">Kevin Sebastián Frías García</h1>
        <p className="role">Full-Stack Developer</p>
      </div>

      <nav aria-label="Primary" className="nav-stack">
        <ul>
          {ROUTES.map((route) => (
            <li key={route.pageId}>
              <NavItem route={route} />
            </li>
          ))}
        </ul>
      </nav>

      <ul className="spec-cascade" aria-hidden="true">
        <li>
          <span className="spec-bar">
            <span className="k">status</span>
            <span className="v" data-truncate="ellipsis">
              placeholder
            </span>
          </span>
        </li>
        <li>
          <span className="spec-bar">
            <span className="k">build</span>
            <span className="v" data-truncate="ellipsis">
              placeholder
            </span>
          </span>
        </li>
        <li>
          <span className="spec-bar">
            <span className="k">mode</span>
            <span className="v" data-truncate="ellipsis">
              placeholder
            </span>
          </span>
        </li>
      </ul>

      {/* Accent bars (doc 12 `.bar--accent`) — two-line plates (phase 4.2):
          each carries a real k/v fact AND a unique hype line, so unlike
          spec-cascade above neither line is aria-hidden and neither may be
          shed at narrow widths. `.accent-plate` is the Home-only
          layout/chrome layer; `.bar--accent` is the shared red skin also
          worn by ProfilePage's CTA button and featured ProjectCards (see
          collage.css D1) — never restructure `.bar--accent` itself here.
          Container MUST be a <div>: two <p> children inside a <p> is
          invalid HTML and the browser would auto-close the outer tag,
          detaching the hype line from the plate. */}
      <div className="bar--accent accent-plate bar--status">
        <p className="bar__spec">
          <span className="k">status</span>
          <span className="v">open to work</span>
        </p>
        <p className="bar__hype">Built to ship</p>
      </div>

      <div className="bar--accent accent-plate bar--build">
        <p className="bar__spec">
          <span className="k">build</span>
          <span className="v">phase_04 // 2026</span>
        </p>
        <p className="bar__hype">No rounded corners</p>
      </div>
    </div>
  );
}
