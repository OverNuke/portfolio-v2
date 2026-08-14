import type { CSSProperties, MouseEvent } from "react";
import type { Project } from "../../content/types";
import { getProjectCategory, getProjectStatus, STATUS_LABEL } from "../../content/projects";

/**
 * The four panel kinds of the /projects sheet. All four share one rule:
 *
 *   A PANEL IS PRINT, NOT UI.
 *
 * No hover, no lift, no shadow change, no rotation — same contract the
 * profile sheet's plates carry. The only interactive things on a sheet are
 * the link chips (or, for a record with no repo, the expand button —
 * `ActionRow` below) inside a panel, and the pager in the pocket.
 *
 * The other rule that will bite someone (docs/02_DESIGN_SYSTEM.MD, and the
 * comment at the top of tokens.css): oxblood on Field Olive is 1.90:1.
 * Nothing oxblood may appear inside an olive panel — not a chip, not a
 * border, not a focus ring. Focus rings inside a panel are Paper White
 * (6.79:1); oxblood focus rings only exist out on the paper margin, which
 * is where the pocket lives.
 */

/** Registration circles on the feature panel, in viewBox percent. */
const MARKS: ReadonlyArray<readonly [string, string]> = [
  ["8%", "5%"],
  ["80%", "14%"],
  ["4%", "48%"],
  ["92%", "64%"],
  ["36%", "93%"],
  ["68%", "88%"],
];

/** Two-digit registration tick. Decorative — always aria-hidden. */
function Tick({ children }: { children: string }) {
  return (
    <span className="sheet-panel__tick" aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * Letterspaced running caption across a panel's head and foot — the
 * reference sheet's "DRUMMING IS WHY WE EXIST" rails. aria-hidden, because
 * every word in it is real DOM text elsewhere on the same panel.
 */
function MicroRail({ parts }: { parts: readonly string[] }) {
  return (
    <p className="sheet-panel__rail" aria-hidden="true">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`}>{part}</span>
      ))}
    </p>
  );
}

/**
 * `href` is a placeholder ("#") on every current record, so a LIVE chip
 * would ship a dead anchor — flagged by jsx-a11y/anchor-is-valid and
 * misleading either way. Same call `ProjectCard` already made: link to the
 * repo when there is one, render nothing when there isn't. The STATUS
 * block already says PRIVATE, so the absence carries the same information.
 */
function LinkChips({ project }: { project: Project }) {
  if (getProjectStatus(project) !== "Live" || !project.repo) return null;
  return (
    <p className="sheet-panel__links">
      <a
        className="sheet-panel__chip"
        href={project.repo}
        target="_blank"
        rel="noopener noreferrer"
      >
        Source
        <span className="visually-hidden"> — {project.title} repository, opens in a new tab</span>
      </a>
    </p>
  );
}

/**
 * Repo link when there's a real one, an expand trigger when there isn't
 * but there's an image worth inspecting closer, nothing when there's
 * neither. Never both — a card gets exactly one action, per the brief.
 * A real `<button>`, never a whole-card link-wrap, for the same reason
 * `LinkChips` above never wraps the whole card either.
 */
function ActionRow({
  project,
  onExpand,
}: {
  project: Project;
  onExpand?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  if (getProjectStatus(project) === "Live" && project.repo) {
    return <LinkChips project={project} />;
  }
  if (onExpand && project.image) {
    return (
      <p className="sheet-panel__links">
        <button type="button" className="sheet-panel__chip sheet-panel__expand" onClick={onExpand}>
          Expand
          <span className="visually-hidden"> — {project.title} screenshot, view larger</span>
        </button>
      </p>
    );
  }
  return null;
}

export type SheetDiscVariant = "fused" | "circle-md" | "circle-sm";

/**
 * The three circular/fused shapes the editorial reference asks for
 * (`docs/design-exploration` `image_01`). Clipped on this inner element,
 * never on `.sheet-panel` itself — the panel already owns the sheet-wipe
 * entrance clip-path and its `prefers-reduced-motion` reset, and a second,
 * static clip-path on the same element would collide with both. When
 * `project.image` is falsy this renders the empty-disc hook a future
 * no-image project lands on (see `.sheet-disc--empty` in
 * `project-sheet.css`) — no component change needed for that case later.
 */
function SheetDisc({
  project,
  variant,
  alt,
}: {
  project: Project;
  variant: SheetDiscVariant;
  alt: string;
}) {
  if (!project.image) {
    return <div className="sheet-disc sheet-disc--empty" aria-hidden="true" />;
  }
  return (
    <figure className={`sheet-disc sheet-disc--${variant}`}>
      <img src={project.image} alt={alt} />
    </figure>
  );
}

function StackBlocks({ project }: { project: Project }) {
  return (
    <p className="sheet-panel__blocks">
      <span className="sheet-panel__blk" data-truncate="ellipsis">
        Stack — {project.tags.join(" · ")}
      </span>
      <span className="sheet-panel__blk" data-truncate="ellipsis">
        Status — {STATUS_LABEL[getProjectStatus(project)]}
      </span>
      <span className="sheet-panel__blk" data-truncate="ellipsis">
        Year — {project.year}
      </span>
    </p>
  );
}

export interface PanelProps {
  project: Project;
  /** Position on this sheet, 1-based. Drives the decorative tick only. */
  position: number;
  /**
   * `gridArea` + `--rot`, from `projectLayouts.ts`'s scatter ladder.
   * Positioning data lives there, not in this file, for the same reason
   * `certLayouts.ts`/`CertWall.tsx` split the two — the ladder can be
   * asserted (`projectLayouts.test.ts`) without rendering anything.
   */
  style?: CSSProperties;
}

export interface RecordPanelProps extends PanelProps {
  /** Which record slot this is, 1-based. Drives `data-record` only — a
   *  registration-tick concern, not positioning (that's `style` now). */
  index: number;
  /**
   * Opens the image-expand overlay for this record. Only meaningful when
   * the record has no repo but does have an image (`ActionRow` decides) —
   * a record with a repo ignores this entirely, and a record with
   * neither gets no action at all. Receives the click event so the caller
   * can capture `event.currentTarget` as the focus-return target.
   */
  onExpand?: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * FEATURE — the tall panel. The one place a screenshot is printed large,
 * on a Paper White mat, lying crooked on the panel. The rotation lives on
 * the mat and only on the mat.
 */
export function FeaturePanel({ project, position, style }: PanelProps) {
  const id = String(position).padStart(3, "0");
  return (
    <article className="sheet-panel sheet-panel--feature" style={style}>
      <MicroRail parts={[getProjectCategory(project), "Record", id]} />
      <h3 className="sheet-panel__display">{project.title}</h3>
      <p className="sheet-panel__sub">{project.subtitle}</p>

      <div className="sheet-panel__stage">
        <SheetDisc project={project} variant="fused" alt={project.imageAlt} />
        <p className="sheet-panel__stage-caption" data-truncate="ellipsis">
          {project.tags.join(" · ")}
        </p>
        {/* Authored positions, never randomised: a page that differs every
            visit reads as broken, not as handmade. Now orbiting the fused
            disc rather than scattered across a rectangular mat. */}
        <svg className="sheet-panel__marks" aria-hidden="true" focusable="false">
          {/* No viewBox on purpose: percentage cx/cy spread the marks across
              the panel while `r` stays in px, so they remain circles instead
              of stretching into ellipses on a tall panel. */}
          {MARKS.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={6} />
          ))}
        </svg>
      </div>

      <MicroRail parts={[STATUS_LABEL[getProjectStatus(project)], project.year, id]} />
      <LinkChips project={project} />
    </article>
  );
}

/**
 * RECORD — the smallest disc, tertiary in the composition's scale
 * hierarchy. Until the 2026-08-13 circular redesign this slot was
 * type-only (no image); the editorial reference's smallest secondary
 * circle requires an image here now — see `SheetShapeDefs.tsx` and
 * `.sheet-disc--circle-sm`. The record still degrades gracefully to the
 * `.sheet-disc--empty` hook if a future record has no image.
 */
export function RecordPanel({ project, position, index, style, onExpand }: RecordPanelProps) {
  return (
    <article className="sheet-panel sheet-panel--record" data-record={index} style={style}>
      <Tick>{`[${String(position).padStart(2, "0")}]`}</Tick>
      <div className="sheet-panel__stage sheet-panel__stage--record">
        <SheetDisc project={project} variant="circle-sm" alt={project.imageAlt} />
      </div>
      <h3 className="sheet-panel__title">{project.title}</h3>
      <p className="sheet-panel__note">{project.subtitle}</p>
      <StackBlocks project={project} />
      <ActionRow project={project} onExpand={onExpand} />
    </article>
  );
}

/**
 * SPREAD — the one Paper White panel, carrying the medium disc and a title
 * set vertically. The vertical title is REAL TEXT rotated with
 * `writing-mode`, never an image and never a transform on a text node:
 * assistive tech reads it normally, and it stays selectable and
 * searchable.
 *
 * `project.imageB`/`imageBAlt` are NOT rendered here since the 2026-08-13
 * circular redesign — a 3-shape composition (fused/medium/small) has no
 * fourth shape to host a second plate. The fields stay in the data model,
 * unused; surfacing the second plate again is new UI scope, not a
 * regression of this one.
 */
export function SpreadPanel({ project, position, style }: PanelProps) {
  return (
    <article className="sheet-panel sheet-panel--spread" style={style}>
      <div className="sheet-panel__stage">
        <SheetDisc project={project} variant="circle-md" alt={project.imageAlt} />
      </div>

      <div className="sheet-panel__body">
        <h3 className="sheet-panel__vertical">{project.title}</h3>
        <div className="sheet-panel__column">
          <Tick>{`[${String(position).padStart(2, "0")}]`}</Tick>
          <p className="sheet-panel__note">{project.description}</p>
          <LinkChips project={project} />
        </div>
        <p className="sheet-panel__vmeta" aria-hidden="true">
          {project.tags.join(" · ")} — {project.year}
        </p>
      </div>
    </article>
  );
}

export interface ColophonProps {
  name: string;
  role: string;
  year: string;
  /** `gridArea` only — the colophon is chrome, not a card, so it never rotates. */
  style?: CSSProperties;
}

/**
 * COLOPHON — the reference sheet's inverted business card. Not a project;
 * it is the sheet talking about itself. Rendered last in DOM (a colophon
 * belongs at the end of a printed sheet) even though it sits mid-page
 * visually. That costs nothing in tab order, because it holds no
 * focusable element.
 */
export function Colophon({ name, role, year, style }: ColophonProps) {
  return (
    <article className="sheet-panel sheet-panel--colophon" style={style}>
      <Tick>[K.S.F.G]</Tick>
      <p className="sheet-panel__blocks">
        <span className="sheet-panel__blk" data-truncate="ellipsis">
          {name}
        </span>
        <span className="sheet-panel__blk" data-truncate="ellipsis">
          {role}
        </span>
        <span className="sheet-panel__blk" data-truncate="ellipsis">
          Records are technical, not marketing
        </span>
      </p>
      <MicroRail parts={["Colophon", year]} />
    </article>
  );
}
