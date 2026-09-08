import type { Project } from "../../content/types";

/**
 * PROJECT DATABASE — the editorial field.
 *
 * Pure layout + slot logic for the /projects composition, kept out of the
 * React components so both can be asserted directly (`fieldLayout.test.ts`)
 * without rendering anything. Same split `certLayouts.ts` uses for the
 * credential wall, and the same one `projectLayouts.ts` used for the panel
 * sheet this file replaces.
 *
 * WHAT REPLACED WHAT (2026-08-13, Keff's editorial brief + `image_01`).
 * The panel sheet — one olive panel per record, scattered across a 12x12
 * grid — is gone. The reference is a SINGLE dark band carrying three
 * shapes, in descending scale, marching left to right, with the largest
 * bleeding past the band's top and bottom edges. There are no per-record
 * panels in it at all, so `projectLayouts.ts`'s grid-area ladder had
 * nothing left to position and was deleted rather than bent.
 *
 * THE COORDINATE SYSTEM. Everything below is a percentage of the STAGE —
 * the bounded box `.pf__stage`, whose aspect ratio is `STAGE_AR` and which
 * is the containing block for every absolutely-positioned piece of the
 * composition. `cx` and `d` are percentages of stage WIDTH; `cy` is a
 * percentage of stage HEIGHT. That asymmetry is not sloppiness: it is
 * exactly how CSS resolves percentage `left`/`width` (against the
 * containing block's width) versus percentage `top` (against its height),
 * so the numbers here go into the style attribute untouched and no
 * conversion math exists anywhere in the component.
 *
 * Converting a diameter into stage-height units — needed to know where a
 * shape's bottom edge lands — is therefore `d * STAGE_AR`. That is what
 * `shapeBottom` below does, and it is the one place that conversion is
 * written down.
 *
 * MEASURED, NOT INVENTED. The 3-record rung is traced off the 1440x900
 * Projects Section artboard (sdd/projects-section-design-import, 2026-09-07):
 * disc rects barbershop 224,126,396²; acopiatech 716,176,228²; odoo
 * 900,298,212², converted here through /1440 (x, d) and /900 (y) into stage
 * coordinates. The other rungs are authored to hold that descending-chain
 * grammar in the shorter band at other record counts; only rung 3 is a
 * tracing.
 *
 * RE-TRACED 2026-09-07 off a new artboard. The previous trace was off
 * `image_01` (band constants 13 / 57 / 78). Changing the three band
 * constants invalidates EVERY rung, not just rung 3 — `assertFieldLayouts()`
 * runs over all of `FIELD_LAYOUTS` — so rungs 1/2/4/5 were re-authored in
 * the same pass (engram discovery/project-field-band-consts-global).
 */

/** Stage aspect (width / height). Mirrored by `--pf-ar` in project-field.css. */
export const STAGE_AR = 1.62;

/**
 * The olive band's top edge and height, in percent of stage height.
 * RE-TRACED 2026-09-07: was 13 / 57 (band bottom 70). Mirrored by
 * `--pf-band-top` / `--pf-band-h`; `fieldLayout.test.ts` asserts the pair.
 */
export const BAND_TOP = 16.7;
export const BAND_H = 41.3;

/**
 * Top edge of the foot index, in percent of stage height. Every shape must
 * clear it — asserted below — because the index carries the only real
 * project text on the composition and a disc lying over it is an occlusion
 * bug, not a style choice. RE-TRACED 2026-09-07: was 78.
 */
export const INDEX_TOP = 63;

export interface FieldShape {
  /** Centre X, percent of stage width. */
  cx: number;
  /** Centre Y, percent of stage height. */
  cy: number;
  /** Diameter, percent of stage width. */
  d: number;
}

export interface FieldColumn {
  /** Left edge, percent of stage width. */
  x: number;
  /** Width, percent of stage width. */
  w: number;
}

export interface FieldSlot {
  shape: FieldShape;
  column: FieldColumn;
  /**
   * Which side of the disc the annotation chip hangs off. AUTHORED, never
   * derived: the artboard sets rung 3 to L, L, R while `data-side`
   * alternates L, R, L. Heuristic for a new rung: the side AWAY from the
   * nearest neighbouring disc. Defaults to "L".
   */
  chipSide?: "L" | "R";
}

export interface FieldLayout {
  /** The dominant record. Always present; the only one allowed to bleed. */
  primary: FieldSlot;
  /** Secondary records, already in descending scale order. 0-4 of them. */
  secondary: FieldSlot[];
}

/** Records on one field before it pages. Unchanged from the panel sheet. */
export const RECORDS_PER_FIELD = 5;

/**
 * One rung per record count, 1 through `RECORDS_PER_FIELD`.
 *
 * Rung 3 is the live set (Barbershop / AcopiaTech / Odoo) and is the
 * tracing of `image_01`. Everything else holds the same grammar: one
 * dominant shape low-left that bleeds past the band, then a strictly
 * descending chain stepping right and down.
 */
export const FIELD_LAYOUTS: Record<number, FieldLayout> = {
  1: {
    primary: { shape: { cx: 30, cy: 33.2, d: 31 }, column: { x: 4, w: 44 }, chipSide: "L" },
    secondary: [],
  },
  2: {
    primary: { shape: { cx: 27, cy: 34.4, d: 29.5 }, column: { x: 4, w: 44 }, chipSide: "L" },
    secondary: [
      { shape: { cx: 68, cy: 37, d: 19 }, column: { x: 55, w: 40 }, chipSide: "R" },
    ],
  },
  // THE REFERENCE DISTRIBUTION — re-traced off the 1440x900 Projects Section
  // artboard, 2026-09-07 (sdd/projects-section-design-import).
  3: {
    primary: { shape: { cx: 29.3, cy: 36.0, d: 27.5 }, column: { x: 9, w: 33 }, chipSide: "L" },
    secondary: [
      // Columns widened slightly from the raw trace (47.5/16, 65.6/18.3) so
      // the narrow secondary prose reflows inside the 900-1100px budget
      // without spilling the stage bottom (R5). Invariants hold: ordered,
      // disjoint (primary edge 42, sec1 42..61, sec2 61..83), primary widest.
      { shape: { cx: 57.6, cy: 32.2, d: 15.8 }, column: { x: 42, w: 19 }, chipSide: "L" },
      { shape: { cx: 69.9, cy: 44.9, d: 14.7 }, column: { x: 61, w: 22 }, chipSide: "R" },
    ],
  },
  4: {
    primary: { shape: { cx: 25, cy: 36.43, d: 27 }, column: { x: 4, w: 32 }, chipSide: "L" },
    secondary: [
      { shape: { cx: 50, cy: 33.5, d: 16 }, column: { x: 40, w: 17 }, chipSide: "L" },
      { shape: { cx: 66, cy: 40, d: 13 }, column: { x: 59, w: 16 }, chipSide: "L" },
      { shape: { cx: 78, cy: 46, d: 10 }, column: { x: 78, w: 20 }, chipSide: "R" },
    ],
  },
  5: {
    primary: { shape: { cx: 21, cy: 36.84, d: 26.5 }, column: { x: 2, w: 26 }, chipSide: "L" },
    secondary: [
      { shape: { cx: 46, cy: 32, d: 12.5 }, column: { x: 30, w: 15 }, chipSide: "L" },
      { shape: { cx: 61, cy: 38, d: 10.5 }, column: { x: 47, w: 14 }, chipSide: "L" },
      { shape: { cx: 73, cy: 44, d: 8.8 }, column: { x: 63, w: 15 }, chipSide: "L" },
      { shape: { cx: 81, cy: 49, d: 7 }, column: { x: 80, w: 18 }, chipSide: "R" },
    ],
  },
};

/** Field capacity. Past this the field pages; it never densifies further. */
export const FIELD_LAYOUT_CAP = RECORDS_PER_FIELD;

export function getFieldLayout(count: number): FieldLayout {
  const n = Math.min(Math.max(count, 1), FIELD_LAYOUT_CAP);
  return FIELD_LAYOUTS[n];
}

/** A shape's bottom edge, in percent of stage HEIGHT. */
export function shapeBottom(shape: FieldShape): number {
  return shape.cy + (shape.d / 2) * STAGE_AR;
}

/** A shape's top edge, in percent of stage HEIGHT. */
export function shapeTop(shape: FieldShape): number {
  return shape.cy - (shape.d / 2) * STAGE_AR;
}

/**
 * The disc annotation chip's offset OUT past the disc edge, and DOWN from
 * its top, as fractions of the disc's own diameter. Traced 2026-09-07 off
 * the three rung-3 chips (-16/396, -14/228, -12/212 → ~0.05; 44/396,
 * 20/228, 18/212 → ~0.115). Single ratios fitted to three chips; max error
 * ~0.8% of stage, visual only.
 */
export const CHIP_OUT = 0.05;
export const CHIP_DROP = 0.115;

/**
 * Stage-percentage anchor for a disc's annotation chip. Returns `left` for
 * an L-side chip and `right` for an R-side one, so the chip always runs
 * INWARD over the disc the way the artboard sets it and no transform is
 * needed — leaving `transform` free for the chip's rotation.
 *
 * Kept here, out of the component, per this file's rule: no conversion math
 * lives in `FieldRecord.tsx`. The component stringifies the number with a
 * `%` unit and drops it straight into the style attribute.
 */
export function chipAnchor(
  shape: FieldShape,
  side: "L" | "R" = "L",
): { top: number; left?: number; right?: number } {
  const top = shapeTop(shape) + shape.d * STAGE_AR * CHIP_DROP;
  return side === "R"
    ? { top, right: 100 - (shape.cx + shape.d / 2) - shape.d * CHIP_OUT }
    : { top, left: shape.cx - shape.d / 2 - shape.d * CHIP_OUT };
}

/**
 * Invariants, checked at module load in DEV (`ProjectField.tsx`) and in
 * CI (`fieldLayout.test.ts`). These are the rules that make the
 * composition a hierarchy rather than three shapes in a row:
 *
 *   1. Scale strictly descends. This IS the hierarchy — the brief asks for
 *      visual importance to be communicated by scale, so two records at
 *      the same diameter would silently flatten it.
 *   2. Nothing leaves the stage horizontally. Vertical bleed past the band
 *      is the whole point of the reference and is allowed; horizontal
 *      bleed is just overflow.
 *   3. No shape reaches the foot index. The index holds every project's
 *      real text and its only interactive control.
 *   4. Caption columns are ordered, disjoint, and on the stage — a column
 *      overlapping its neighbour is two records' text on top of each other.
 *   5. The primary's caption column is the widest. The foot index states
 *      the hierarchy a second time, in measure rather than in scale; a
 *      secondary record with a wider column than the primary would have
 *      the two statements contradicting each other.
 *   6. The primary bleeds past the band's TOP edge, and no secondary
 *      bleeds past either edge. RELAXED 2026-09-07: the invariant used to
 *      require the primary to bleed past BOTH edges. On the re-traced
 *      artboard the primary is tangent at the band's bottom (58.3% vs
 *      58.0%) and a 0.3% overshoot is noise, not a gesture — so only the
 *      top bleed is asserted. The primary's bottom is still bounded, by
 *      invariant 3 (INDEX_TOP), which is the bound that matters: the foot
 *      index carries every project's real text.
 */
export function assertFieldLayouts(): void {
  for (const [count, layout] of Object.entries(FIELD_LAYOUTS)) {
    const slots = [layout.primary, ...layout.secondary];

    if (Number(count) !== slots.length) {
      throw new Error(`Field layout ${count}: declares ${slots.length} slot(s)`);
    }

    for (let i = 1; i < slots.length; i++) {
      if (slots[i].shape.d >= slots[i - 1].shape.d) {
        throw new Error(
          `Field layout ${count}: shape ${i + 1} (d=${slots[i].shape.d}) does not descend from shape ${i} (d=${slots[i - 1].shape.d})`,
        );
      }
    }

    slots.forEach((slot, i) => {
      const { cx, d } = slot.shape;
      if (cx - d / 2 < 0 || cx + d / 2 > 100) {
        throw new Error(`Field layout ${count}: shape ${i + 1} leaves the stage horizontally`);
      }
      if (shapeTop(slot.shape) < 0) {
        throw new Error(`Field layout ${count}: shape ${i + 1} leaves the stage at the top`);
      }
      if (shapeBottom(slot.shape) > INDEX_TOP) {
        throw new Error(
          `Field layout ${count}: shape ${i + 1} reaches the foot index (bottom ${shapeBottom(slot.shape).toFixed(1)}% > ${INDEX_TOP}%)`,
        );
      }
    });

    let edge = 0;
    slots.forEach((slot, i) => {
      const { x, w } = slot.column;
      if (x < edge) {
        throw new Error(`Field layout ${count}: column ${i + 1} overlaps the one before it`);
      }
      if (x + w > 100) {
        throw new Error(`Field layout ${count}: column ${i + 1} leaves the stage`);
      }
      edge = x + w;
    });

    const bandBottom = BAND_TOP + BAND_H;

    // RELAXED 2026-09-07 (sdd/projects-section-design-import). Was: bleed
    // past BOTH edges. The Projects Section artboard's primary is TANGENT at
    // the band's bottom (58.3% vs 58.0%) — a 0.3% overshoot is not a bleed,
    // it is noise that flips sign on a 0.1 tweak to `cy` or `d`. Worth
    // recording: the OLD both-edge assertion did NOT throw on the new
    // numbers (58.275 <= 58.0 is false), so this is a semantic correction,
    // not a mechanical fix. The recognisable gesture is the TOP bleed, and
    // that is what is asserted. The primary's bottom stays bounded by
    // invariant 3 (INDEX_TOP), which is the bound that actually matters.
    if (shapeTop(layout.primary.shape) >= BAND_TOP) {
      throw new Error(
        `Field layout ${count}: the primary no longer bleeds past the band's top edge`,
      );
    }

    layout.secondary.forEach((slot, i) => {
      if (slot.column.w >= layout.primary.column.w) {
        throw new Error(
          `Field layout ${count}: secondary caption column ${i + 1} (${slot.column.w}%) is at least as wide as the primary's (${layout.primary.column.w}%)`,
        );
      }
      if (shapeTop(slot.shape) < BAND_TOP || shapeBottom(slot.shape) > bandBottom) {
        throw new Error(`Field layout ${count}: secondary shape ${i + 1} bleeds past the band`);
      }
    });
  }
}

export interface FieldSlots {
  /** The dominant record. Always present when the field has one at all. */
  primary: Project;
  /** Everything else, in the order it takes the descending chain. */
  secondary: Project[];
}

/**
 * Splits one field's records into the primary + descending chain.
 *
 * `sheetSlot` on the record stays authoritative, and stays the name it
 * always had — the field reads `feature` as "this is the dominant shape".
 * The `spread` value no longer selects a distinct panel kind (there are no
 * panels), so it is now simply a hint that a record sorts ahead of the
 * plain `record`s in the chain. Data did not have to change for this
 * redesign, which is why it didn't.
 *
 * The fallback exists so a field still composes if someone adds a project
 * and forgets the field: the first record becomes primary. It is a safety
 * net, not the intended path.
 */
export function assignSlots(projects: readonly Project[]): FieldSlots | null {
  if (projects.length === 0) return null;

  const primary = projects.find((p) => p.sheetSlot === "feature") ?? projects[0];
  const rest = projects.filter((p) => p !== primary);

  const rank = (p: Project) => (p.sheetSlot === "spread" ? 0 : 1);
  const secondary = [...rest].sort((a, b) => rank(a) - rank(b));

  return { primary, secondary };
}

/** Chunks every record into fields of at most `RECORDS_PER_FIELD`. */
export function paginate(projects: readonly Project[], perField = RECORDS_PER_FIELD): Project[][] {
  if (perField < 1) throw new RangeError("perField must be at least 1");
  if (projects.length === 0) return [[]];

  const fields: Project[][] = [];
  for (let i = 0; i < projects.length; i += perField) {
    fields.push(projects.slice(i, i + perField));
  }
  return fields;
}

/** How much of the stage a zoomed record fills, in percent. */
export const ZOOM_W = 74;
export const ZOOM_H = 82;
/**
 * Guard for the small discs — resamples a 1-bit halftone plate past its dot
 * grid otherwise (`image-rendering: pixelated`; doc 13, "the dither IS the
 * image"). Stays 3. RE-TRACED 2026-09-07: on the new rung 3 this cap binds
 * for BOTH secondaries (AcopiaTech d≈15.8, Odoo d≈14.7) — that is the cap
 * working, not a regression. Consequence: the old "every disc zooms to the
 * same on-screen height" guarantee is gone (ZOOM_H no longer binds at every
 * rung); the zoom now preserves the descending-scale rank instead.
 */
export const ZOOM_MAX_SCALE = 3;

export interface ZoomTransform {
  /** translateX, in percent of the FIGURE's own width. */
  dx: number;
  /** translateY, in percent of the FIGURE's own height. */
  dy: number;
  scale: number;
}

/**
 * Move a shape's centre to the stage's centre and scale it to fill the
 * zoom box, in the figure element's OWN units.
 *
 * The unit conversion is the only subtle part. `translate()` percentages
 * resolve against the element's own border box, not its containing block.
 * The figure's width is `d`% of stage width and it is square, so its
 * height in percent of stage HEIGHT is `d * STAGE_AR` — the same
 * conversion `shapeBottom` already writes down.
 */
export function zoomToCenter(shape: FieldShape): ZoomTransform {
  const hPct = shape.d * STAGE_AR; // figure height, % of stage height
  return {
    dx: ((50 - shape.cx) / shape.d) * 100,
    dy: ((50 - shape.cy) / hPct) * 100,
    scale: Math.min(ZOOM_W / shape.d, ZOOM_H / hPct, ZOOM_MAX_SCALE),
  };
}

/**
 * Clamps an arbitrary (URL-supplied) field number into range. A junk or
 * out-of-range `?sheet=` must land on a real field rather than an empty
 * page — deep links outlive the data they were made against. The query
 * param keeps its old name so existing links still resolve.
 */
export function clampField(raw: string | null, fieldCount: number): number {
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), Math.max(fieldCount, 1));
}
