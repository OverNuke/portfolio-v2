import { SiGithub } from "@icons-pack/react-simple-icons";
import { useEffect, useId, useRef, type CSSProperties, type MouseEvent } from "react";
import type { Project } from "../../content/types";
import {
  getProjectCategory,
  getProjectStatus,
  getTechIcon,
  resolveChipText,
  STATUS_LABEL,
} from "../../content/projects";
import type { FieldSlot } from "./fieldLayout";
import { chipAnchor, INDEX_TOP, zoomToCenter } from "./fieldLayout";
import { useInert } from "../../turn/useInert";

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
 * change, no whole-card link wrap.
 *
 * THE RULE THAT WILL BITE SOMEONE, also unchanged: oxblood on Field Olive
 * is 1.90:1. The band is olive, so nothing oxblood may sit on it — but the
 * foot index is on paper, which is why the chips and their oxblood focus
 * rings live down there and not up on the band.
 *
 * P1 (sdd/design-import-sections, 2026-09-04): the fused-lobe shape is gone.
 * Every disc on the field — primary included — is a plain
 * `circle(closest-side)` in `.pf-shape--circle`; the primary is marked by
 * `data-primary` and the caption hierarchy, not by a distinct shape.
 * `FieldShapeDefs.tsx` and the `FieldShapeVariant` union went with it — a
 * union with one member was noise.
 */

export type FieldRecordZoom = "none" | "self" | "other";

export interface FieldRecordProps {
  project: Project;
  slot: FieldSlot;
  /** 1-based position on this field. Drives the decorative tick only. */
  position: number;
  /** The dominant record gets the large caption (no longer a distinct shape). */
  primary?: boolean;
  /**
   * Opens the in-place zoom. Every record with an image gets this now
   * (P2 fixed the latent bug where the primary had no `onExpand` at all) —
   * a record with a repo ALSO gets this, it is no longer either/or. Receives
   * the event so the caller can capture `event.currentTarget` as the
   * focus-return target.
   */
  onExpand?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * P3 (sdd/design-import-sections): "self" while THIS record is the one
   * zoomed, "other" while a SIBLING is (marks this article `inert`),
   * "none" the rest of the time. Replaces `ImageExpandOverlay`'s separate
   * modal — the expanded record becomes its own `role="dialog"` in place,
   * rather than opening a second element elsewhere in the tree.
   */
  zoom?: FieldRecordZoom;
  /** Escape, ArrowRight, the scrim, or the Close button, while zoomed. */
  onCloseZoom?: () => void;
}

/**
 * Repo link when there is a real one, AND an expand trigger whenever there
 * is an image worth inspecting closer. Both, not either/or — P2
 * (sdd/design-import-sections) overturns this function's old "never both"
 * rule, which was itself the reason the primary never got an `onExpand` in
 * the first place: this used to be a single-branch `if`/`else if`, and the
 * primary's branch (repo, since Barbershop has one) meant the expand
 * affordance was unreachable for it. There is no longer a reason for the
 * two to be exclusive: a repo link and an in-place zoom answer different
 * questions ("see the code" vs. "see the screenshot larger") and neither
 * disables the other.
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
  const repo = getProjectStatus(project) === "Live" && project.repo;
  const expandable = Boolean(onExpand && project.image);

  if (!repo && !expandable) return null;

  return (
    <p className="pf-record__action">
      {repo && (
        <a className="pf-chip" href={project.repo} target="_blank" rel="noopener noreferrer">
          {/* Decorative: the chip already says "Repository" and the
              visually-hidden tail names the project. It only draws in the
              poster tier — see `.pf-chip svg` in project-field.css for why
              the foot index withholds it. */}
          <SiGithub size={11} aria-hidden="true" />
          Repository
          <span className="visually-hidden"> — {project.title}, opens in a new tab</span>
        </a>
      )}
      {expandable && (
        <button type="button" className="pf-chip pf-chip--expand" onClick={onExpand}>
          Expand
          <span className="visually-hidden"> — {project.title} screenshot, view larger</span>
        </button>
      )}
    </p>
  );
}

/**
 * The disc itself. When `project.image` is absent this renders the
 * no-image fallback the brief's section 9 asks for: a restrained,
 * `[data-motion]`-gated registration animation instead of a photograph
 * (`.pf-shape--empty` in `project-field.css`). No record exercises that
 * branch today; it is a real code path rather than a promise, so the day
 * one does, nothing here has to change.
 */
function Shape({ project }: { project: Project }) {
  if (!project.image) {
    return <div className="pf-shape pf-shape--circle pf-shape--empty" aria-hidden="true" />;
  }
  return (
    <div className="pf-shape pf-shape--circle">
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

export function FieldRecord({
  project,
  slot,
  position,
  primary,
  onExpand,
  zoom = "none",
  onCloseZoom,
}: FieldRecordProps) {
  const tick = `[${String(position).padStart(2, "0")}]`;
  const { shape, column } = slot;
  const titleId = useId();
  const articleRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const zoomed = zoom === "self";

  /**
   * PER-RECORD INERT (P3) — replaces `ProjectField.tsx`'s old
   * `useInert(recordsRef, expanded !== null)` on the WHOLE `.pf__records`
   * container, which could not inert the container of the record it was
   * itself displaying. Only the articles that are NOT the zoomed one go
   * inert; this one, while `zoom === "self"`, never does.
   *
   * `useInert` (not the React 19 `inert` JSX prop the design doc assumed —
   * this codebase is on React 18.3, which ships neither the prop nor a
   * jsdom `inert` implementation) is the existing imperative
   * attribute+aria-hidden pairing `src/turn/useInert.ts` already provides
   * for exactly this reason.
   */
  useInert(articleRef, zoom === "other");

  // Focus lands on Close the instant this record's own zoom opens —
  // parity with `ImageExpandOverlay`'s `closeRef.current?.focus()`.
  useEffect(() => {
    if (zoomed) closeRef.current?.focus();
  }, [zoomed]);

  // Ported verbatim from `ImageExpandOverlay.tsx`: a CAPTURE-phase listener
  // with `stopPropagation()`, which is what reliably wins against
  // `useTurnKeyboard`'s BUBBLE-phase Escape/ArrowRight handler — without it,
  // Escape would close the whole page out from under the zoom.
  useEffect(() => {
    if (!zoomed || !onCloseZoom) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      if (event.key !== "Escape" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      onCloseZoom?.();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [zoomed, onCloseZoom]);

  const figureStyle: CSSProperties = {
    left: `calc(${shape.cx}% - ${shape.d}% / 2)`,
    top: `${shape.cy}%`,
    width: `${shape.d}%`,
  };

  // The annotation chip's anchor is stage-percentage arithmetic on the same
  // shape data — `fieldLayout.ts`'s `chipAnchor`, no DOM measurement. The
  // chip is a SIBLING of `.pf-record__figure` (a direct child of the
  // article, which is `inset: 0` over the stage), never a child: a child
  // would inherit the figure's four-way drop-shadow edge and be scaled
  // 1.8x-3x by the zoom transform.
  const anchor = chipAnchor(shape, slot.chipSide ?? "L");
  const chipStyle: CSSProperties = {
    top: `${anchor.top}%`,
    ...(anchor.left !== undefined
      ? { left: `${anchor.left}%` }
      : { right: `${anchor.right}%` }),
  };

  const capStyle: CSSProperties = {
    left: `${column.x}%`,
    width: `${column.w}%`,
    top: `${INDEX_TOP}%`,
  };

  // The zoom transform is pure arithmetic on the same layout data that
  // positions the figure at rest (`fieldLayout.ts`'s `zoomToCenter`) — no
  // DOM measurement, no ref reads. Custom properties on the ARTICLE (not
  // the figure) so `project-field.css`'s
  // `.pf-record[data-zoom="self"] .pf-record__figure` rule can read them
  // and compose them with the figure's existing `translateY(-50%)`.
  const zoomStyle: CSSProperties | undefined = zoomed
    ? ((): CSSProperties => {
        const t = zoomToCenter(shape);
        return {
          "--pf-zoom-dx": `${t.dx}%`,
          "--pf-zoom-dy": `${t.dy}%`,
          "--pf-zoom-s": t.scale,
        } as CSSProperties;
      })()
    : undefined;

  return (
    <article
      ref={articleRef}
      className="pf-record"
      data-primary={primary ? "1" : "0"}
      data-record={position}
      // Odd records compose left, even records mirror right — the poster
      // tier alternates so a scroll of them reads as a sequence rather
      // than a repeat. Written here rather than left to `:nth-child(even)`
      // so the alternation survives reordering or pagination, the same
      // reason `fieldLayout.ts` assigns slots explicitly.
      data-side={position % 2 === 1 ? "left" : "right"}
      data-zoom={zoom}
      style={zoomStyle}
      // `role="dialog"` lands on the article itself rather than a second
      // element elsewhere in the tree — its subtree already holds both the
      // image and (via `aria-labelledby`) the accessible name. `aria-modal`
      // stays omitted: `PageLayer` already wraps the routed page in one,
      // and modal-ness here comes from the OTHER records going `inert`.
      role={zoomed ? "dialog" : undefined}
      aria-labelledby={zoomed ? titleId : undefined}
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

      {/* The two parts that survive the 900px line and are worth
          following across it (docs/14_REFORM_MOTION.md). The plate SCALES
          — it is a square, so the circle stays a circle under a uniform
          scale — and the caption does not, because scaled type smears at
          every intermediate frame. */}
      <div
        className="pf-record__figure"
        style={figureStyle}
        data-reform-id={`figure-${position}`}
        data-reform-rank={position - 1}
      >
        <Shape project={project} />
      </div>

      {/* The disc's short-label chip — marker-hand, rotated past `--rot-max`
          (a sanctioned local exception, see project-field.css). Decorative:
          the category is exposed for real in `.pf-record__kind`. Sibling of
          the figure, on its AUTHORED side (`slot.chipSide`), not the
          alternating `data-side`. */}
      <span className="pf-record__chip" style={chipStyle} aria-hidden="true">
        {resolveChipText(project)}
      </span>

      <div
        className="pf-record__cap"
        style={capStyle}
        data-reform-id={`cap-${position}`}
        data-reform-rank={position - 1}
        data-reform-scale="none"
      >
        <p className="pf-record__lead" aria-hidden="true">
          <span className="pf-record__tick">{tick}</span>
          <span className="pf-record__rule" />
          <span className="pf-record__kind">{getProjectCategory(project)}</span>
        </p>
        <h3 id={titleId} className="pf-record__title">
          {project.title}
        </h3>
        {/* `__body` is `display: contents` above 900px, so the caption
            column reads exactly as it always did. In the poster tier it
            becomes the head block — the one group that stays a stack while
            the tick, kind and title leave for their own corners. */}
        <div className="pf-record__body">
          {/* ONE node, serving BOTH tiers. Desktop: `display: none` (CSS),
              so it is out of the a11y tree and `subtitle` announces once
              via `.pf-record__marker` below. Poster (<900px): shown, the
              unchanged tracked-uppercase treatment. Do not split it. */}
          <p className="pf-record__sub">{project.subtitle}</p>
          {/* Desktop foot-column body — a short prose paragraph off
              `description`, then the marker line. Both `display: none` in
              the poster tier. */}
          <p className="pf-record__prose">{project.description}</p>
          <p className="pf-record__marker">{project.marker ?? project.subtitle}</p>
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

      {/* ZOOM CHROME — mounted only while this record is the zoomed one.
          `.pf-zoom__close` must NOT live inside `.pf-record__cap`: that
          element is `visibility: hidden` while zoomed (see project-field.css
          ZOOM section), and a close button inside a hidden subtree would
          not be focusable, landing focus on <body> on open. It is a direct
          child of the article instead. The scrim reuses `.pf-record`'s own
          `inset: 0` box — it already spans the whole stage. */}
      {zoomed && (
        <>
          <div className="pf-zoom__scrim" aria-hidden="true" onClick={onCloseZoom} />
          <button type="button" ref={closeRef} className="pf-zoom__close" onClick={onCloseZoom}>
            Close
            <span className="visually-hidden"> — or press Escape / Right Arrow</span>
          </button>
        </>
      )}
    </article>
  );
}
