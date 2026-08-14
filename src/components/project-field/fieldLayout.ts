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
 * MEASURED, NOT INVENTED. The 3-record rung is traced off `image_01`:
 * band-relative centres (29.7%, 50%) / (64.6%, 47%) / (82%, 64%) and
 * diameters 43% / 24.8% / 18% of the band's width, converted here into
 * stage coordinates through `BAND_TOP`/`BAND_H`. Ratios 1 : 0.577 : 0.419.
 * The other rungs are authored to hold that descending-chain feel at other
 * record counts; only rung 3 is a tracing.
 */

/** Stage aspect (width / height). Mirrored by `--pf-ar` in project-field.css. */
export const STAGE_AR = 1.62;

/** The olive band's top edge and height, in percent of stage height. */
export const BAND_TOP = 13;
export const BAND_H = 57;

/**
 * Top edge of the foot index, in percent of stage height. Every shape must
 * clear it — asserted below — because the index carries the only real
 * project text on the composition and a disc lying over it is an occlusion
 * bug, not a style choice.
 */
export const INDEX_TOP = 78;

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
    primary: { shape: { cx: 30, cy: 41.5, d: 44 }, column: { x: 4, w: 44 } },
    secondary: [],
  },
  2: {
    primary: { shape: { cx: 27, cy: 41.5, d: 42 }, column: { x: 4, w: 44 } },
    secondary: [{ shape: { cx: 68, cy: 41.5, d: 27 }, column: { x: 55, w: 40 } }],
  },
  // THE REFERENCE DISTRIBUTION — traced off `image_01`, 2026-08-13.
  3: {
    primary: { shape: { cx: 29.7, cy: 41.5, d: 43 }, column: { x: 4, w: 42 } },
    secondary: [
      { shape: { cx: 64.6, cy: 39.8, d: 24.8 }, column: { x: 52, w: 20 } },
      { shape: { cx: 82, cy: 49.5, d: 18 }, column: { x: 73, w: 25 } },
    ],
  },
  4: {
    primary: { shape: { cx: 25, cy: 41.5, d: 38 }, column: { x: 4, w: 32 } },
    secondary: [
      { shape: { cx: 52, cy: 38, d: 22 }, column: { x: 40, w: 17 } },
      { shape: { cx: 71, cy: 47, d: 17 }, column: { x: 59, w: 16 } },
      { shape: { cx: 87, cy: 55, d: 13 }, column: { x: 78, w: 20 } },
    ],
  },
  5: {
    primary: { shape: { cx: 19, cy: 41.5, d: 37 }, column: { x: 2, w: 26 } },
    secondary: [
      { shape: { cx: 47, cy: 37, d: 17 }, column: { x: 30, w: 15 } },
      { shape: { cx: 65, cy: 45, d: 14 }, column: { x: 47, w: 14 } },
      { shape: { cx: 80, cy: 52, d: 11.5 }, column: { x: 63, w: 15 } },
      { shape: { cx: 92.5, cy: 58, d: 9 }, column: { x: 80, w: 18 } },
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
 *   6. The primary bleeds past BOTH band edges, and no secondary bleeds
 *      past either. This is the single most recognisable thing about
 *      `image_01` and the easiest to lose in a later tweak: a rung whose
 *      primary has quietly shrunk back inside the band still satisfies
 *      every other rule here and no longer looks like the reference.
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

    if (
      shapeTop(layout.primary.shape) >= BAND_TOP ||
      shapeBottom(layout.primary.shape) <= bandBottom
    ) {
      throw new Error(`Field layout ${count}: the primary no longer bleeds past both band edges`);
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
