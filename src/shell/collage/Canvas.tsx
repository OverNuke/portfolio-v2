import { ROUTES } from "../../routes/routes";
import { CertificateField } from "./CertificateField";
import { NavItem } from "./NavItem";
import { SkillsCollage } from "./SkillsCollage";
import "./collage.css";

/**
 * Task 3.1 (sdd/phase2-app-shell), design "Collage Canvas" section. The
 * 12x12 grid container (`.canvas`), composed inside `Shell.tsx`'s existing
 * `<main id="main-content">`. Wraps the identity content (previously
 * inline in `Shell.tsx`, batch 5 — moved here so it can be placed as a
 * grid plate), the real NavItem list (task 2.6), a placeholder
 * spec-cascade plate, the certificate field, and the (seeded) Skills badge
 * field — the latter two replace the standalone `/skills` route.
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

      <CertificateField />
      <SkillsCollage />
    </div>
  );
}
