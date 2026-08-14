import type { Project } from "../../content/types";

/**
 * Pure layout logic for the /projects panel sheet. Kept out of the React
 * components so the slot-assignment rules can be asserted directly
 * (`sheetLayout.test.ts`) without rendering anything.
 *
 * Spec: `claude/projects-module-manga-sheet-2026-08-05.md`. Originally: the
 * sheet is a page of tiled panels with a gutter — NOT doc 12's overlap
 * collage. Panels never touch, never rotate, never overlap; only the images
 * inside them lean.
 *
 * Updated 2026-08-12: Keff explicitly sanctioned overturning that "never
 * touch, never rotate, never overlap" rule for this module — see
 * `project-sheet.css`'s header comment for the full record. The template
 * ladder that used to live here (`templateFor`/`SheetTemplate`, T1–T4) is
 * gone; positioning is now `projectLayouts.ts`'s scatter ladder
 * (`getProjectLayout`), which every panel receives as an inline
 * `gridArea`/`--rot` style. `assignSlots`/`paginate`/`clampSheet` below are
 * unaffected — none of them care about visual layout, only about which
 * project fills which role.
 */

/** Records per sheet before the page turns. Keff, 2026-08-05. */
export const RECORDS_PER_SHEET = 5;

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
