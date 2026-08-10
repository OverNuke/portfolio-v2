import type { Project } from "../../content/types";
import { useReducedMotion } from "../../shell/useReducedMotion";
import { assignSlots, templateFor } from "./sheetLayout";
import { Colophon, FeaturePanel, RecordPanel, SpreadPanel } from "./SheetPanels";
import "./project-sheet.css";

export interface ProjectSheetProps {
  /** One sheet's worth of records — already paginated by the caller. */
  projects: readonly Project[];
  sheetIndex: number;
  sheetCount: number;
  totalRecords: number;
  /** Year range printed in the pocket, e.g. "2023—2026". */
  span?: string;
  colophonName: string;
  colophonRole: string;
  onPrev?: () => void;
  onNext?: () => void;
}

/**
 * PROJECT DATABASE — the panel sheet. Spec:
 * `claude/projects-module-manga-sheet-2026-08-05.md`.
 *
 * A page of tiled panels on paper, derived from Keff's N.Y DRUMS reference
 * sheet. This replaces the horizontally-extending project list, which
 * existed because Home's no-scroll rule was applied one level too far —
 * docs/03_UX_ARCHITECTURE.MD is explicit that "the shell never scrolls,
 * content is always free to", so a module page was never bound by it.
 *
 * Three invariants the audit asserts, and that any change here must keep:
 *   1. No two panels overlap. Panels are tiled, not stacked.
 *   2. Panel rotation is exactly 0. Only `.sheet-plate` (an image mat) may
 *      rotate, capped at 6deg, and it goes to 0 below 900px.
 *   3. Nothing oxblood may sit inside an olive panel (1.90:1). The pocket
 *      is on paper, which is the only reason it may carry the status chip.
 *
 * DOM order is pocket -> feature -> records -> spread -> colophon, which
 * is normal reading order for everything focusable. Per
 * docs/05_ACCESSIBILITY.MD, tab order follows reading order regardless of
 * the right-to-left turn — the manga convention is a sighted, spatial
 * device and a screen-reader user should never feel it. The colophon
 * trails in DOM despite sitting mid-page: it is a colophon, it holds no
 * focusable element, and reading it last is correct.
 */
export function ProjectSheet({
  projects,
  sheetIndex,
  sheetCount,
  totalRecords,
  span,
  colophonName,
  colophonRole,
  onPrev,
  onNext,
}: ProjectSheetProps) {
  const reducedMotion = useReducedMotion();
  const slots = assignSlots(projects);

  if (!slots) {
    return (
      <div className="project-sheet project-sheet--empty">
        <div className="project-sheet__grid">
          <article className="sheet-panel sheet-panel--record">
            <span className="sheet-panel__tick" aria-hidden="true">
              [--]
            </span>
            <h3 className="sheet-panel__title">No records</h3>
            <p className="sheet-panel__note">The archive is empty.</p>
          </article>
        </div>
      </div>
    );
  }

  const { feature, spread, records } = slots;
  // Positions drive the decorative tick only, and follow DOM order:
  // feature, then records, then spread. They are SHEET positions, not
  // stable project ids — they renumber when the order changes, which is
  // what a registration mark on a printed sheet does. A record that needs
  // an identifier surviving reorder needs a real field, not this.
  const featurePos = 1;
  const spreadPos = 2 + records.length;

  return (
    <div
      className="project-sheet"
      data-tpl={templateFor(projects.length)}
      data-spread={spread ? "1" : "0"}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <div className="project-sheet__grid">
        {/* The 12-row grid made visible as chrome. It doubles as the sheet's
          panel index once the page fills up — same job as the numbered
          ruler down the edge of the reference poster. */}
        <div className="project-sheet__rail" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i}>{String(i + 1).padStart(2, "0")}</span>
          ))}
        </div>

        <header className="project-sheet__pocket">
          <p className="project-sheet__row">
            <span>Records</span>
            <b>{String(totalRecords).padStart(2, "0")}</b>
          </p>
          <p className="project-sheet__row">
            <span>Sheet</span>
            <b>
              {String(sheetIndex).padStart(2, "0")} / {String(sheetCount).padStart(2, "0")}
            </b>
          </p>
          {span && (
            <p className="project-sheet__row">
              <span>Span</span>
              <b>{span}</b>
            </p>
          )}

          {sheetCount > 1 && (
            <p className="project-sheet__pager">
              <button type="button" onClick={onNext} disabled={!onNext}>
                <span aria-hidden="true">◀</span> Next sheet
              </button>
              <button type="button" onClick={onPrev} disabled={!onPrev}>
                Prev <span aria-hidden="true">▶</span>
              </button>
            </p>
          )}
        </header>

        <FeaturePanel project={feature} position={featurePos} />

        {records.map((project, i) => (
          <RecordPanel key={project.title} project={project} position={i + 2} index={i + 1} />
        ))}

        {spread && <SpreadPanel project={spread} position={spreadPos} />}

        <Colophon name={colophonName} role={colophonRole} year="2026" />
      </div>
    </div>
  );
}
