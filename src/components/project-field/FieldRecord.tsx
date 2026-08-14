import { SiGithub } from "@icons-pack/react-simple-icons";
import type { CSSProperties, MouseEvent } from "react";
import type { Project } from "../../content/types";
import {
  getProjectCategory,
  getProjectStatus,
  getTechIcon,
  STATUS_LABEL,
} from "../../content/projects";
import type { FieldSlot } from "./fieldLayout";
import { INDEX_TOP } from "./fieldLayout";

/**
 * ONE RECORD ON THE FIELD — a shape on the band, plus its caption column
 * in the foot index, held together in a single `<article>`.
 *
 * WHY ONE ARTICLE FOR TWO SEPARATED THINGS. The disc and its caption sit
 * in different parts of the composition, but they are one record, and a
 * screen reader must be told that: the disc's alt text and the caption's
 * heading, stack, status and link belong to the same project. Splitting
 * them into two sibling regions would put the image in one place and the
 * name of the thing it depicts somewhere else.
 *
 * So the article is `position: absolute; inset: 0` over the WHOLE stage
 * and paints nothing itself; the two children carry the positioning. That
 * means every record's box overlaps every other record's box, which would
 * be an occlusion bug — except the article is `pointer-events: none` and
 * only the chip inside the caption takes them back. Nothing on the field
 * is clickable except that chip, so there is nothing to occlude. See
 * `project-field.css`'s RECORD section.
 *
 * A PANEL IS PRINT, NOT UI — the rule the old panel sheet carried, and it
 * survives the redesign intact. No hover on the disc, no lift, no shadow
 * change, no whole-card link wrap. Exactly one action per record.
 *
 * THE RULE THAT WILL BITE SOMEONE, also unchanged: oxblood on Field Olive
 * is 1.90:1. The band is olive, so nothing oxblood may sit on it — but the
 * foot index is on paper, which is why the chips and their oxblood focus
 * rings live down there and not up on the band.
 */

export type FieldShapeVariant = "fused" | "circle";

export interface FieldRecordProps {
  project: Project;
  slot: FieldSlot;
  /** 1-based position on this field. Drives the decorative tick only. */
  position: number;
  /** The dominant record gets the fused shape and the large caption. */
  primary?: boolean;
  /**
   * Opens the image-expand overlay. Only reached by a record with no repo
   * that does have an image (`RecordAction` decides) — a record with a
   * repo ignores it, and one with neither gets no action at all. Receives
   * the event so the caller can capture `event.currentTarget` as the
   * focus-return target.
   */
  onExpand?: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Repo link when there is a real one, an expand trigger when there isn't
 * but there is an image worth inspecting closer, nothing when there is
 * neither. Never both.
 *
 * `project.href` is a placeholder ("#") on every current record, so a LIVE
 * chip would ship a dead anchor — flagged by jsx-a11y/anchor-is-valid and
 * misleading either way. The caption's STATUS line already says PRIVATE,
 * so the absence carries the same information the dead link would have.
 */
function RecordAction({
  project,
  onExpand,
}: {
  project: Project;
  onExpand?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  if (getProjectStatus(project) === "Live" && project.repo) {
    return (
      <p className="pf-record__action">
        <a className="pf-chip" href={project.repo} target="_blank" rel="noopener noreferrer">
          {/* Decorative: the chip already says "Repository" and the
              visually-hidden tail names the project. It only draws in the
              poster tier — see `.pf-chip svg` in project-field.css for why
              the foot index withholds it. */}
          <SiGithub size={11} aria-hidden="true" />
          Repository
          <span className="visually-hidden"> — {project.title}, opens in a new tab</span>
        </a>
      </p>
    );
  }

  if (onExpand && project.image) {
    return (
      <p className="pf-record__action">
        <button type="button" className="pf-chip pf-chip--expand" onClick={onExpand}>
          Expand
          <span className="visually-hidden"> — {project.title} screenshot, view larger</span>
        </button>
      </p>
    );
  }

  return null;
}

/**
 * The disc itself. When `project.image` is absent this renders the
 * no-image fallback the brief's section 9 asks for: a restrained,
 * `[data-motion]`-gated registration animation instead of a photograph
 * (`.pf-shape--empty` in `project-field.css`). No record exercises that
 * branch today; it is a real code path rather than a promise, so the day
 * one does, nothing here has to change.
 */
function Shape({ project, variant }: { project: Project; variant: FieldShapeVariant }) {
  if (!project.image) {
    return <div className={`pf-shape pf-shape--${variant} pf-shape--empty`} aria-hidden="true" />;
  }
  return (
    <div className={`pf-shape pf-shape--${variant}`}>
      <img src={project.image} alt={project.imageAlt} />
    </div>
  );
}

/**
 * The stack line, as brand marks.
 *
 * FULLY DECORATIVE, and that is the point rather than an oversight. Every
 * tag it draws is already real, accessible text a few elements away in
 * `.pf-record__stack` — which stays in the accessibility tree at every
 * width and is merely clipped out of sight in the poster tier. An icon row
 * repeating text that is already present in the same record IS ornament,
 * so it says so, and nothing here is announced twice.
 *
 * A tag simple-icons has no mark for degrades to a two-letter monogram
 * rather than to a gap — see `getTechIcon`.
 */
function TechBadges({ tags }: { tags: readonly string[] }) {
  return (
    <p className="pf-record__badges" aria-hidden="true">
      {tags.map((tag) => {
        const Icon = getTechIcon(tag);
        return (
          <span className="pf-record__badge" key={tag}>
            {Icon ? <Icon size={13} /> : <span className="pf-record__mono">{tag.slice(0, 2)}</span>}
          </span>
        );
      })}
    </p>
  );
}

/**
 * The year, split for the poster tier's stamp: "2025" sets as 20 over 25,
 * under a "c", the way the reference poster stamps a century.
 *
 * SPLIT ONLY WHEN IT IS ACTUALLY A FOUR-DIGIT YEAR. `Project.year` is a
 * free-form string, and slicing "2023—2024" in half produces "2023—" over
 * "2024", which is not a stamp, it is a bug wearing one. Anything else
 * prints whole and the stamp rule simply doesn't draw.
 */
function Year({ year }: { year: string }) {
  const halves = /^\d{4}$/.test(year) ? [year.slice(0, 2), year.slice(2)] : [year];
  return (
    <span className="pf-record__year" data-split={halves.length === 2 ? "1" : "0"}>
      {halves.map((half) => (
        <span className="pf-record__yr" key={half}>
          {half}
        </span>
      ))}
    </span>
  );
}

export function FieldRecord({ project, slot, position, primary, onExpand }: FieldRecordProps) {
  const tick = `[${String(position).padStart(2, "0")}]`;
  const { shape, column } = slot;

  const figureStyle: CSSProperties = {
    left: `calc(${shape.cx}% - ${shape.d}% / 2)`,
    top: `${shape.cy}%`,
    width: `${shape.d}%`,
  };

  const capStyle: CSSProperties = {
    left: `${column.x}%`,
    width: `${column.w}%`,
    top: `${INDEX_TOP}%`,
  };

  return (
    <article
      className="pf-record"
      data-primary={primary ? "1" : "0"}
      data-record={position}
      // Odd records compose left, even records mirror right — the poster
      // tier alternates so a scroll of them reads as a sequence rather
      // than a repeat. Written here rather than left to `:nth-child(even)`
      // so the alternation survives reordering or pagination, the same
      // reason `fieldLayout.ts` assigns slots explicitly.
      data-side={position % 2 === 1 ? "left" : "right"}
    >
      {/* POSTER FURNITURE. Three empty decorative boxes that draw nothing
          above 900px and carry the whole composition below it: the corner
          bar, the corner block, and the accent disc the plate is tinted
          by. They live here rather than in the stylesheet's `::before`/
          `::after` because the disc needs its own stacking position
          between the plate and the type, and one element cannot hold three
          pseudo-layers. */}
      <span className="pf-record__bar" aria-hidden="true" />
      <span className="pf-record__corner" aria-hidden="true" />
      <span className="pf-record__disc" aria-hidden="true" />

      <div className="pf-record__figure" style={figureStyle}>
        <Shape project={project} variant={primary ? "fused" : "circle"} />
      </div>

      <div className="pf-record__cap" style={capStyle}>
        <p className="pf-record__lead" aria-hidden="true">
          <span className="pf-record__tick">{tick}</span>
          <span className="pf-record__rule" />
          <span className="pf-record__kind">{getProjectCategory(project)}</span>
        </p>
        <h3 className="pf-record__title">{project.title}</h3>
        {/* `__body` is `display: contents` above 900px, so the caption
            column reads exactly as it always did. In the poster tier it
            becomes the head block — the one group that stays a stack while
            the tick, kind and title leave for their own corners. */}
        <div className="pf-record__body">
          <p className="pf-record__sub">{project.subtitle}</p>
          <p className="pf-record__meta">
            <span className="pf-record__stack">{project.tags.join(" · ")}</span>
            <span className="pf-record__reg">
              <span className="pf-record__status">{STATUS_LABEL[getProjectStatus(project)]}</span>
              <span className="pf-record__sep" aria-hidden="true">
                {" "}
                ·{" "}
              </span>
              <Year year={project.year} />
            </span>
          </p>
          <RecordAction project={project} onExpand={onExpand} />
          <TechBadges tags={project.tags} />
        </div>
      </div>
    </article>
  );
}
