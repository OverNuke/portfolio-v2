import type { Project } from "../../content/types";

/**
 * Pure layout logic for the /projects panel sheet. Kept out of the React
 * components so the ladder and the slot rules can be asserted directly
 * (`sheetLayout.test.ts`) without rendering anything.
 *
 * Spec: `claude/projects-module-manga-sheet-2026-08-05.md`. The sheet is a
 * page of tiled panels with a gutter — NOT doc 12's overlap collage. Panels
 * never touch, never rotate, never overlap; only the images inside them
 * lean. Home gets its order from depth, this gets its order from division,
 * and keeping the two modes distinct is what stops the whole site reading
 * as one texture.
 */

/** Records per sheet before the page turns. Keff, 2026-08-05. */
export const RECORDS_PER_SHEET = 5;

export type SheetTemplate = 1 | 2 | 3 | 4;

export interface SheetSlots {
  /** Always present when the sheet has at least one record. */
  feature: Project;
  /** The two-plate panel. Absent only on a one-record sheet. */
  spread?: Project;
  /** Type-only panels. 0–3, matching the ladder. */
  records: Project[];
}

/**
 * Splits one sheet's records into slots.
 *
 * `sheetSlot` on the record is authoritative. The fallbacks exist so a
 * sheet still composes if someone adds a project and forgets the field:
 * first record becomes the feature, last becomes the spread. They are a
 * safety net, not the intended path — set `sheetSlot` explicitly.
 */
export function assignSlots(projects: readonly Project[]): SheetSlots | null {
  if (projects.length === 0) return null;

  const feature = projects.find((p) => p.sheetSlot === "feature") ?? projects[0];
  const rest = projects.filter((p) => p !== feature);

  const spread =
    rest.find((p) => p.sheetSlot === "spread") ??
    (rest.length > 0 ? rest[rest.length - 1] : undefined);

  const records = rest.filter((p) => p !== spread);

  return { feature, spread, records };
}

/**
 * The template ladder. Density is not achieved by shrinking a fixed layout
 * — each rung is its own authored composition, and what varies is how much
 * paper is left showing. Selection is deterministic on record count, which
 * makes it strictly safer than doc 12's weighted-random Skills seeds.
 */
export function templateFor(recordCount: number): SheetTemplate {
  if (recordCount <= 2) return 1;
  if (recordCount === 3) return 2;
  if (recordCount === 4) return 3;
  return 4;
}

/** Chunks every record into sheets of at most `RECORDS_PER_SHEET`. */
export function paginate(projects: readonly Project[], perSheet = RECORDS_PER_SHEET): Project[][] {
  if (perSheet < 1) throw new RangeError("perSheet must be at least 1");
  if (projects.length === 0) return [[]];

  const sheets: Project[][] = [];
  for (let i = 0; i < projects.length; i += perSheet) {
    sheets.push(projects.slice(i, i + perSheet));
  }
  return sheets;
}

/**
 * Clamps an arbitrary (URL-supplied) sheet number into range. A junk or
 * out-of-range `?sheet=` must land on a real sheet rather than an empty
 * page — deep links outlive the data they were made against.
 */
export function clampSheet(raw: string | null, sheetCount: number): number {
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), Math.max(sheetCount, 1));
}
