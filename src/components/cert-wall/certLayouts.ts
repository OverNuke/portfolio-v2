/**
 * CERTIFICATE WALL — the layout ladders.
 *
 * Two ladders, because the module must never scroll at 768px and up (Keff,
 * 2026-08-06) and a landscape sheet cannot fill a tablet held in portrait:
 *
 *   W1–W6  landscape sheet, `--cw-ar` 8/5   — desktop and tablet landscape
 *   P1–P4  portrait sheet,  `--cw-ar` 4/5   — tablet portrait
 *
 * Below 768px neither applies: the wall hands over to the ledger, which is
 * the one place scrolling is permitted (WCAG 1.4.10 reflow release, the
 * boundary `docs/05_ACCESSIBILITY.MD` already uses).
 *
 * Layouts are PRE-AUTHORED and selected deterministically by record count —
 * the projects module's T1–T4 device (`sheetLayout.ts`), never the weighted
 * randomness of `useCollageSeed`. `12_COLLAGE_SYSTEM.md`: randomising
 * placement at runtime makes the page different every visit, which reads as
 * broken rather than as handmade.
 *
 * Each slot declares the orientation it WANTS. Keff's certificates are three
 * portrait A4s and two landscape, so slots are not interchangeable — the same
 * principle as `Project.sheetSlot`. `assignSlots` matches records to slots by
 * scan orientation so a portrait certificate never lands in a 2:1 letterbox.
 */

export type Orientation = "portrait" | "landscape";

export interface CertSlot {
  /** `row-start / col-start / row-end / col-end` on the 12×12 grid. */
  area: string;
  /** Authored per position. |rot| <= ROT_MAX, asserted by `assertCertLayouts`. */
  rot: number;
  /** The orientation this cell is shaped for. */
  wants: Orientation;
}

export interface CertLayout {
  slots: CertSlot[];
  /** Annotation scrap position, or null when the sheet has no air to spare. */
  scrap: string | null;
  /** Tightened at the top of a ladder, where no empty cell is left to spend. */
  gutter?: string;
}

export const ROT_MAX = 2;

/** Sheet capacity. Past this the page turns; the sheet never densifies further. */
export const PER_SHEET_LANDSCAPE = 6;
export const PER_SHEET_PORTRAIT = 4;

/**
 * Reserved cells, identical across every layout in both ladders, so the sheet
 * chrome never moves as the record count changes.
 */
export const RESERVED: ReadonlyArray<readonly [string, string]> = [
  ["head", "1 / 1 / 3 / 5"],
  ["meta", "1 / 9 / 2 / 13"],
  ["chrome", "2 / 5 / 3 / 9"],
];

/** Landscape ladder — `aspect-ratio: 8/5`, so one grid cell is 1.6 : 1.
 *  Mat aspect = 1.6 x cols / rows. A mat is scan + caption bar, so the mat
 *  runs TALLER than the document it frames: target ~1.25 for a landscape
 *  certificate (A4 landscape is 1.41) and ~0.62 for a portrait A4 (0.707).
 *  Standard cells: landscape 4c x 5r = 1.28 or 6c x 8r = 1.20;
 *                  portrait  2c x 5r = 0.64 or 3c x 8r = 0.60. */
export const WALL_LANDSCAPE: Record<number, CertLayout> = {
  1: {
    slots: [{ area: "3 / 1 / 11 / 7", rot: -1.1, wants: "landscape" }],
    scrap: "4 / 8 / 7 / 12",
  },
  2: {
    slots: [
      { area: "3 / 1 / 11 / 7", rot: -1.1, wants: "landscape" },
      { area: "3 / 8 / 11 / 11", rot: 0.9, wants: "portrait" },
    ],
    scrap: "11 / 1 / 13 / 5",
  },
  3: {
    slots: [
      { area: "3 / 1 / 11 / 7", rot: -1.1, wants: "landscape" },
      { area: "3 / 7 / 11 / 10", rot: 0.9, wants: "portrait" },
      { area: "3 / 10 / 11 / 13", rot: -1.7, wants: "portrait" },
    ],
    scrap: "11 / 1 / 13 / 5",
  },
  4: {
    slots: [
      { area: "3 / 1 / 8 / 5", rot: -1.1, wants: "landscape" },
      { area: "3 / 5 / 8 / 7", rot: 0.9, wants: "portrait" },
      { area: "3 / 8 / 8 / 10", rot: -1.7, wants: "portrait" },
      { area: "8 / 1 / 13 / 5", rot: 1.4, wants: "landscape" },
    ],
    scrap: "9 / 6 / 12 / 10",
  },
  // W5 is Keff's live set: ANFECA + anglo are landscape, the three A4s portrait.
  5: {
    slots: [
      { area: "3 / 1 / 8 / 5", rot: -1.1, wants: "landscape" },
      { area: "3 / 5 / 8 / 7", rot: 0.9, wants: "portrait" },
      { area: "3 / 10 / 8 / 12", rot: -1.7, wants: "portrait" },
      { area: "4 / 8 / 9 / 10", rot: 1.2, wants: "portrait" },
      { area: "8 / 1 / 13 / 5", rot: 1.4, wants: "landscape" },
    ],
    scrap: "9 / 6 / 12 / 10",
  },
  6: {
    slots: [
      { area: "3 / 1 / 8 / 5", rot: -1.1, wants: "landscape" },
      { area: "3 / 5 / 8 / 7", rot: 1.2, wants: "portrait" },
      { area: "3 / 7 / 8 / 9", rot: -1.5, wants: "portrait" },
      { area: "3 / 9 / 8 / 11", rot: 0.8, wants: "portrait" },
      { area: "8 / 3 / 13 / 7", rot: 1.4, wants: "landscape" },
      { area: "8 / 7 / 13 / 11", rot: -0.9, wants: "landscape" },
    ],
    scrap: null,
    gutter: ".85cqw",
  },
};

/** Portrait ladder — `aspect-ratio: 4/5`, one cell is 0.8 : 1.
 *  Mat aspect = 0.8 x cols / rows. Same targets as above.
 *  Standard cells: landscape 8c x 5r = 1.28 or 12c x 8r = 1.20;
 *                  portrait  4c x 5r = 0.64 or 6c x 8r = 0.60. */
export const WALL_PORTRAIT: Record<number, CertLayout> = {
  1: {
    slots: [{ area: "3 / 1 / 11 / 13", rot: -1.1, wants: "landscape" }],
    scrap: "11 / 1 / 13 / 7",
  },
  2: {
    slots: [
      { area: "3 / 1 / 8 / 9", rot: -1.1, wants: "landscape" },
      { area: "8 / 4 / 13 / 12", rot: 0.9, wants: "landscape" },
    ],
    scrap: "3 / 9 / 6 / 13",
  },
  3: {
    slots: [
      { area: "3 / 1 / 8 / 9", rot: -1.1, wants: "landscape" },
      { area: "8 / 1 / 13 / 5", rot: 0.9, wants: "portrait" },
      { area: "8 / 6 / 13 / 10", rot: -1.4, wants: "portrait" },
    ],
    scrap: "3 / 9 / 6 / 13",
  },
  4: {
    slots: [
      { area: "3 / 1 / 8 / 9", rot: -1.1, wants: "landscape" },
      { area: "3 / 9 / 8 / 13", rot: 1.2, wants: "portrait" },
      { area: "8 / 1 / 13 / 5", rot: 0.9, wants: "portrait" },
      { area: "8 / 5 / 13 / 9", rot: -1.4, wants: "portrait" },
    ],
    scrap: "9 / 9 / 12 / 13",
    gutter: ".85cqw",
  },
};

export function perSheet(orientation: Orientation): number {
  return orientation === "portrait" ? PER_SHEET_PORTRAIT : PER_SHEET_LANDSCAPE;
}

export function getCertLayout(sheet: Orientation, count: number): CertLayout {
  const ladder = sheet === "portrait" ? WALL_PORTRAIT : WALL_LANDSCAPE;
  const n = Math.min(Math.max(count, 1), perSheet(sheet));
  return ladder[n];
}

/**
 * Match records to slots by orientation, preserving reading order as far as
 * the shapes allow. Greedy and stable: each slot takes the first unused record
 * whose scan matches its `wants`, then falls back to the first unused record of
 * any orientation, so a set with no portrait scans still fills every slot.
 *
 * Returns indices INTO `orientations`, one per slot.
 */
export function assignSlots(
  orientations: ReadonlyArray<Orientation>,
  slots: ReadonlyArray<CertSlot>,
): number[] {
  const used = new Array(orientations.length).fill(false);
  const out: number[] = [];

  for (const slot of slots) {
    let pick = orientations.findIndex((o, i) => !used[i] && o === slot.wants);
    if (pick === -1) pick = used.findIndex((u) => !u);
    if (pick === -1) break;
    used[pick] = true;
    out.push(pick);
  }
  return out;
}

function parseArea(area: string): [number, number, number, number] {
  const p = area.split("/").map((s) => Number(s.trim()));
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n))) {
    throw new Error(`Malformed grid-area: "${area}"`);
  }
  return p as [number, number, number, number];
}

function overlaps(a: string, b: string): boolean {
  const [ar1, ac1, ar2, ac2] = parseArea(a);
  const [br1, bc1, br2, bc2] = parseArea(b);
  return ar1 < br2 && br1 < ar2 && ac1 < bc2 && bc1 < ac2;
}

/**
 * Every mat carries a hit target, so an overlap here is an occlusion bug, not
 * a style choice — `12_COLLAGE_SYSTEM.md` forbids covering a control. Assert
 * it at the data layer rather than trusting the grid-area block; the DOM audit
 * in `scripts/audit.mjs` is the second layer and catches CSS regressions this
 * one cannot see.
 */
export function assertCertLayouts(): void {
  const ladders: Array<[string, Record<number, CertLayout>]> = [
    ["W", WALL_LANDSCAPE],
    ["P", WALL_PORTRAIT],
  ];

  for (const [prefix, ladder] of ladders) {
    for (const [count, layout] of Object.entries(ladder)) {
      const id = `${prefix}${count}`;
      const named: Array<[string, string]> = [
        ...RESERVED.map((r) => [r[0], r[1]] as [string, string]),
        ...layout.slots.map((s, i) => [`mat${i + 1}`, s.area] as [string, string]),
        ...(layout.scrap ? ([["scrap", layout.scrap]] as Array<[string, string]>) : []),
      ];

      if (Number(count) !== layout.slots.length) {
        throw new Error(`${id}: declares ${layout.slots.length} slots`);
      }

      for (const s of layout.slots) {
        if (Math.abs(s.rot) > ROT_MAX) {
          throw new Error(`${id}: rotation ${s.rot}deg exceeds +/-${ROT_MAX}deg (${s.area})`);
        }
      }

      for (const [name, area] of named) {
        const [r1, c1, r2, c2] = parseArea(area);
        if (r1 < 1 || c1 < 1 || r2 > 13 || c2 > 13 || r1 >= r2 || c1 >= c2) {
          throw new Error(`${id}: ${name} (${area}) is outside the 12x12 grid or inverted`);
        }
      }

      for (let i = 0; i < named.length; i++) {
        for (let j = i + 1; j < named.length; j++) {
          if (overlaps(named[i][1], named[j][1])) {
            throw new Error(
              `${id}: ${named[i][0]} (${named[i][1]}) overlaps ${named[j][0]} (${named[j][1]})`,
            );
          }
        }
      }
    }
  }
}
