import { useRef, useState, type MouseEvent } from "react";
import type { Project } from "../../content/types";
import { useReducedMotion } from "../../shell/useReducedMotion";
import { useInert } from "../../turn/useInert";
import { FieldRecord } from "./FieldRecord";
import { FieldShapeDefs } from "./FieldShapeDefs";
import { ImageExpandOverlay } from "./ImageExpandOverlay";
import { assertFieldLayouts, assignSlots, getFieldLayout } from "./fieldLayout";
import "./project-field.css";

if (import.meta.env.DEV) assertFieldLayouts();

export interface ProjectFieldProps {
  /** One field's worth of records — already paginated by the caller. */
  projects: readonly Project[];
  fieldIndex: number;
  fieldCount: number;
  totalRecords: number;
  /** Year range printed in the band's meta, e.g. "2023—2026". */
  span?: string;
  /** Printed in the band's foot note — the field talking about itself. */
  colophonName: string;
  colophonRole: string;
  onPrev?: () => void;
  onNext?: () => void;
  /**
   * The route's short label ("PROJECTS"), used as the giant section title.
   * Sourced from `ROUTES` by the caller rather than typed here so it
   * cannot drift — the same reasoning `RouteConfig.lede`'s doc comment
   * gives.
   */
  macroWord?: string;
}

/**
 * PROJECT DATABASE — the editorial field.
 *
 * Rebuilt 2026-08-13 from Keff's brief and `image_01`. What this replaced,
 * and why, in one paragraph, because the diff is large: the module used to
 * be a panel sheet — one olive panel per record, scattered across a 12x12
 * grid, each panel carrying its own title, blocks and chip. The reference
 * has no panels in it. It is a SINGLE dark band with three shapes lying on
 * it in descending scale, the largest bleeding past the band's top and
 * bottom edges, and almost no type: a mark in one corner, a meta block in
 * another, a few micro lines in a third. Restyling panels could not get
 * there, so the panels went and the band arrived. `projectLayouts.ts`'s
 * grid-area ladder had nothing left to position and was deleted with them.
 *
 * WHERE THE PROJECT TEXT WENT. A portfolio still has to say what the
 * projects are, and the reference gives it nowhere to go. It lives in a
 * FOOT INDEX on the paper below the band: three micro columns, each
 * left-aligned under its own shape, their widths descending with the
 * shapes so the hierarchy is stated twice — once in scale, once in
 * measure. Keff's call, 2026-08-13, over labelling inside the band (the
 * discs leave almost no vertical room) and over hover-reveal (which hides
 * the projects by default).
 *
 * THE COMPOSITION IS DATA. Every position is a percentage of this
 * component's bounded stage, and every one of them lives in
 * `fieldLayout.ts` — traced off the reference for the live 3-record set,
 * authored for the other rungs, and asserted (descending scale, nothing
 * off-stage, nothing reaching the foot index, no column overlapping its
 * neighbour). Adding a fourth project needs a rung, not a redesign.
 *
 * DOM ORDER is title -> band chrome -> records in descending scale ->
 * overlay, which is both reading order and visual left-to-right order, so
 * tab order needs no correction. Per docs/05_ACCESSIBILITY.MD that holds
 * regardless of the shell's right-to-left page turn: the manga convention
 * is a sighted, spatial device and a screen-reader user should never feel
 * it.
 */
export function ProjectField({
  projects,
  fieldIndex,
  fieldCount,
  totalRecords,
  span,
  colophonName,
  colophonRole,
  onPrev,
  onNext,
  macroWord = "PROJECTS",
}: ProjectFieldProps) {
  const reducedMotion = useReducedMotion();
  const slots = assignSlots(projects);
  const layout = getFieldLayout(projects.length);

  const [expanded, setExpanded] = useState<{ project: Project; trigger: HTMLElement } | null>(null);
  const recordsRef = useRef<HTMLDivElement>(null);
  useInert(recordsRef, expanded !== null);

  if (!slots) {
    return (
      <div className="pf pf--empty">
        <div className="pf__stage">
          <div className="pf__band">
            <p className="pf__mark" aria-hidden="true">
              {macroWord}
            </p>
          </div>
          <div className="pf__empty">
            <h3>No records</h3>
            <p>The archive is empty.</p>
          </div>
        </div>
      </div>
    );
  }

  const { primary, secondary } = slots;
  // The title is real, visible, readable text — not a decorative fragment
  // with a visually-hidden twin. The panel sheet needed that idiom because
  // its title was split into two giant aria-hidden chunks; this one is a
  // single word, so the plainest possible markup is also the accessible
  // one. Distinct from `PageLayer`'s own <h1> ("PROJECT DATABASE"), which
  // stays the page's sole title — this <h2> labels the composition.
  const fullTitle = macroWord.charAt(0) + macroWord.slice(1).toLowerCase();

  const onExpand = (project: Project) => (event: MouseEvent<HTMLButtonElement>) =>
    setExpanded({ project, trigger: event.currentTarget });

  return (
    <div
      className="pf"
      data-layout={projects.length}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <div className="pf__stage">
        <FieldShapeDefs />

        <h2 className="pf__title">{fullTitle}</h2>

        {/* The band is the artboard, and it is decoration in the strict
            sense: every string printed on it is either a label for
            something the foot index already states in full, or the
            module's own colophon. Nothing here is the only copy of
            anything, which is why losing it below 768px costs nothing. */}
        <div className="pf__band">
          <p className="pf__mark" aria-hidden="true">
            Project database
          </p>

          <div className="pf__meta">
            <p className="pf__row">
              <span>Records</span>
              <b>{String(totalRecords).padStart(2, "0")}</b>
            </p>
            <p className="pf__row">
              <span>Field</span>
              <b>
                {String(fieldIndex).padStart(2, "0")} / {String(fieldCount).padStart(2, "0")}
              </b>
            </p>
            {span && (
              <p className="pf__row">
                <span>Span</span>
                <b>{span}</b>
              </p>
            )}

            {fieldCount > 1 && (
              <p className="pf__pager">
                <button type="button" onClick={onNext} disabled={!onNext}>
                  <span aria-hidden="true">◀</span> Next
                </button>
                <button type="button" onClick={onPrev} disabled={!onPrev}>
                  Prev <span aria-hidden="true">▶</span>
                </button>
              </p>
            )}
          </div>

          {/* The reference's bottom-left micro block, carrying the old
              sheet's colophon — the field talking about itself. It sits in
              the pocket the primary shape's lower-left arc curves away
              from; see `project-field.css`'s BAND section for the arc
              maths that keeps it clear. */}
          <p className="pf__note" aria-hidden="true">
            <span>{colophonName}</span>
            <span>{colophonRole}</span>
            <span>Records are technical, not marketing</span>
          </p>
        </div>

        {/* `display: contents` — a ref and inert target only. The records
            inside stay direct children of `.pf__stage` for positioning
            purposes, exactly as if this wrapper weren't here, while still
            being a real element React can attach a ref to and the `inert`
            attribute can walk into. */}
        <div className="pf__records" ref={recordsRef}>
          <FieldRecord project={primary} slot={layout.primary} position={1} primary />
          {secondary.map((project, i) => (
            <FieldRecord
              key={project.title}
              project={project}
              slot={layout.secondary[i]}
              position={i + 2}
              onExpand={onExpand(project)}
            />
          ))}
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
