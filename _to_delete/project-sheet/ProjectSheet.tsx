import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { Project } from "../../content/types";
import { useReducedMotion } from "../../shell/useReducedMotion";
import { useInert } from "../../turn/useInert";
import { ImageExpandOverlay } from "./ImageExpandOverlay";
import { assertProjectLayouts, getProjectLayout, type ProjectSlot } from "./projectLayouts";
import { assignSlots } from "./sheetLayout";
import { SheetShapeDefs } from "./SheetShapeDefs";
import { Colophon, FeaturePanel, RecordPanel, SpreadPanel } from "./SheetPanels";
import "./project-sheet.css";

if (import.meta.env.DEV) assertProjectLayouts();

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
  /**
   * Route's short label ("PROJECTS"), split into the two decorative giant-
   * type fragments (`.sheet-title__frag`) and title-cased into the real
   * accessible `<h2>` string behind them. Sourced from `ROUTES` by the
   * caller rather than typed here, so it can't drift — same reasoning
   * `RouteConfig.lede`'s doc comment gives.
   */
  macroWord?: string;
}

function slotStyle(slot: ProjectSlot): CSSProperties {
  return { gridArea: slot.area, "--rot": `${slot.rot}deg` } as CSSProperties;
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
 * Updated 2026-08-12 — the invariants below replace the originals (no
 * overlap at all, panel rotation exactly 0). See `project-sheet.css`'s
 * header comment for the full record of what changed and why. Current
 * invariants, asserted by `projectLayouts.test.ts` and this file's own
 * `assertProjectLayouts()` call:
 *   1. No two cards' `area` overlap (pocket and colophon included) — the
 *      composition reads as scattered/asymmetric, not stacked. Cards ARE
 *      allowed to overlap the decorative giant-type layer
 *      (`.sheet-title__frag`), since it is `aria-hidden` and costs nothing
 *      to cover.
 *   2. Every card's rotation is |rot| <= 2deg (`ROT_MAX` in
 *      `projectLayouts.ts`), applied to the whole panel — and, since
 *      2026-08-13, to the circular/fused disc inside it as one rigid unit
 *      (see `project-sheet.css`'s DISCS section). Rotation relaxes below
 *      1100px and goes to 0 below 768px, the WCAG 1.4.10 reflow floor
 *      (docs/05_ACCESSIBILITY.MD) — not 900px, a stale figure this comment
 *      used to carry.
 *   3. Nothing oxblood may sit inside an olive panel (1.90:1). The pocket
 *      is on paper, which is the only reason it may carry the status chip.
 *
 * DOM order is pocket -> feature -> records -> spread -> colophon, which
 * is normal reading order for everything focusable. Per
 * docs/05_ACCESSIBILITY.MD, tab order follows reading order regardless of
 * the right-to-left turn — the manga convention is a sighted, spatial
 * device and a screen-reader user should never feel it. The colophon
 * trails in DOM despite sitting mid-page: it is a colophon, it holds no
 * focusable element, and reading it last is correct. Positioning
 * (`style={{ gridArea, "--rot" }}`) is purely visual, from
 * `projectLayouts.ts` — it never reorders the DOM.
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
  macroWord = "PROJECTS",
}: ProjectSheetProps) {
  const reducedMotion = useReducedMotion();
  const slots = assignSlots(projects);
  const layout = getProjectLayout(projects.length);
  // Authored split, not a generic midpoint: tuned so both fragments read as
  // whole word-chunks at giant size, the same call Home's `.hm-kg` makes
  // with literal "K"/"G" initials. If `macroWord` ever changes, the split
  // still renders something — it just may need re-tuning by eye.
  const kgA = macroWord.slice(0, 3);
  const kgB = macroWord.slice(3);
  // The real, readable heading string behind the giant decorative
  // fragments above — same "aria-hidden fragments + visually-hidden full
  // string" idiom `ProfilePlate`'s wordmark uses for `profile.mark`.
  // Distinct wording from `PageLayer`'s own <h1> ("PROJECT DATABASE"),
  // which stays the page's sole title; this h2 labels the composition.
  const fullTitle = macroWord.charAt(0) + macroWord.slice(1).toLowerCase();

  const [expanded, setExpanded] = useState<{ project: Project; trigger: HTMLElement } | null>(
    null,
  );
  const panelsRef = useRef<HTMLDivElement>(null);
  useInert(panelsRef, expanded !== null);

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
      data-layout={projects.length}
      data-spread={spread ? "1" : "0"}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <div className="project-sheet__grid">
        <SheetShapeDefs />

        {/* Decorative background layer, mirroring Home's `.hm-kg`: giant,
            low-opacity, aria-hidden fragments, lowest z-band. Cards sit on
            top of them freely — that overlap is the whole point and costs
            nothing. `<h2>` is real, distinct from PageLayer's own <h1>
            ("PROJECT DATABASE") — it labels this composition, not the
            page. The full string is visually-hidden above 768px (the
            fragments carry the visual weight) and becomes the visible,
            static heading once the sheet stacks — see project-sheet.css's
            768px tier. */}
        <h2 className="sheet-title">
          <span className="sheet-title__frag sheet-title__frag--a" aria-hidden="true">
            {kgA}
          </span>
          <span className="sheet-title__frag sheet-title__frag--b" aria-hidden="true">
            {kgB}
          </span>
          <span className="sheet-title__full">{fullTitle}</span>
        </h2>

        <div className="project-sheet__panels" ref={panelsRef}>
          {/* The 12-row grid made visible as chrome. It doubles as the
            sheet's panel index once the page fills up — same job as the
            numbered ruler down the edge of the reference poster. */}
          <div className="project-sheet__rail" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i}>{String(i + 1).padStart(2, "0")}</span>
            ))}
          </div>

          <header className="project-sheet__pocket" style={{ gridArea: layout.pocket }}>
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

          <FeaturePanel
            project={feature}
            position={featurePos}
            style={slotStyle(layout.feature)}
          />

          {records.map((project, i) => (
            <RecordPanel
              key={project.title}
              project={project}
              position={i + 2}
              index={i + 1}
              style={slotStyle(layout.records[i])}
              onExpand={(event: MouseEvent<HTMLButtonElement>) =>
                setExpanded({ project, trigger: event.currentTarget })
              }
            />
          ))}

          {spread && layout.spread && (
            <SpreadPanel project={spread} position={spreadPos} style={slotStyle(layout.spread)} />
          )}

          <Colophon
            name={colophonName}
            role={colophonRole}
            year="2026"
            style={{ gridArea: layout.colophon }}
          />
        </div>

        {expanded && (
          <ImageExpandOverlay
            project={expanded.project}
            onClose={() => setExpanded(null)}
            returnFocusTo={expanded.trigger}
          />
        )}
      </div>
    </div>
  );
}
