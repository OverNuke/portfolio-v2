import type { Project } from "../../content/types";
import { getProjectCategory, getProjectStatus, STATUS_LABEL } from "../../content/projects";

/**
 * The four panel kinds of the /projects sheet. All four share one rule:
 *
 *   A PANEL IS PRINT, NOT UI.
 *
 * No hover, no lift, no shadow change, no rotation — same contract the
 * profile sheet's plates carry. The only interactive things on a sheet are
 * the link chips inside a panel and the pager in the pocket.
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
}

export interface RecordPanelProps extends PanelProps {
  /**
   * Which record slot this is, 1-based. Drives `data-record`, which the
   * template ladder keys its grid-areas off. It cannot be `:nth-of-type`
   * in CSS: every panel is an `<article>`, so `:nth-of-type(2)` would
   * select the feature panel, not the second record.
   */
  index: number;
}

/**
 * FEATURE — the tall panel. The one place a screenshot is printed large,
 * on a Paper White mat, lying crooked on the panel. The rotation lives on
 * the mat and only on the mat.
 */
export function FeaturePanel({ project, position }: PanelProps) {
  const id = String(position).padStart(3, "0");
  return (
    <article className="sheet-panel sheet-panel--feature">
      <MicroRail parts={[getProjectCategory(project), "Record", id]} />
      <h3 className="sheet-panel__display">{project.title}</h3>
      <p className="sheet-panel__sub">{project.subtitle}</p>

      <div className="sheet-panel__stage">
        <figure className="sheet-plate sheet-plate--feature">
          <img src={project.image} alt={project.imageAlt} />
          <figcaption data-truncate="ellipsis">{project.tags.join(" · ")}</figcaption>
        </figure>
        {/* Authored positions, never randomised: a page that differs every
            visit reads as broken, not as handmade. */}
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
 * RECORD — type only, no image. This is what the reference sheet's cards
 * do and it is what gives the sheet its rhythm; confirmed by Keff
 * 2026-08-05 (Odoo is the record whose screenshot the sheet doesn't
 * print). The record still carries `image` in the data — the slot just
 * doesn't render one.
 */
export function RecordPanel({ project, position, index }: RecordPanelProps) {
  return (
    <article className="sheet-panel sheet-panel--record" data-record={index}>
      <Tick>{`[${String(position).padStart(2, "0")}]`}</Tick>
      <h3 className="sheet-panel__title">{project.title}</h3>
      <p className="sheet-panel__note">{project.subtitle}</p>
      <StackBlocks project={project} />
      <LinkChips project={project} />
    </article>
  );
}

/**
 * SPREAD — the one Paper White panel, carrying two plates and a title set
 * vertically. The vertical title is REAL TEXT rotated with `writing-mode`,
 * never an image and never a transform on a text node: assistive tech
 * reads it normally, and it stays selectable and searchable.
 */
export function SpreadPanel({ project, position }: PanelProps) {
  return (
    <article className="sheet-panel sheet-panel--spread">
      <div className="sheet-panel__plates">
        <figure className="sheet-plate sheet-plate--a">
          <img src={project.image} alt={project.imageAlt} />
        </figure>
        {project.imageB && (
          <figure className="sheet-plate sheet-plate--b">
            <img src={project.imageB} alt={project.imageBAlt ?? ""} />
          </figure>
        )}
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
}

/**
 * COLOPHON — the reference sheet's inverted business card. Not a project;
 * it is the sheet talking about itself. Rendered last in DOM (a colophon
 * belongs at the end of a printed sheet) even though it sits mid-page
 * visually. That costs nothing in tab order, because it holds no
 * focusable element.
 */
export function Colophon({ name, role, year }: ColophonProps) {
  return (
    <article className="sheet-panel sheet-panel--colophon">
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
