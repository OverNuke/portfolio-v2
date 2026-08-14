/**
 * CERTIFICATE WALL — the layout ladders.
 *
 * Two ladders, because the module must never scroll at 768px and up (Keff,
 * 2026-08-06) and a landscape sheet cannot fill a tablet held in portrait:
 *
 *   W1–W9  landscape sheet, `--cw-ar` 8/5   — desktop and tablet landscape
 *   P1–P6  portrait sheet,  `--cw-ar` 4/5   — tablet portrait
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
 * > Updated 2026-08-13. This module is a scoped, documented exception to two
 * > otherwise-locked conventions — see `docs/12_COLLAGE_SYSTEM.md` and
 * > `docs/02_DESIGN_SYSTEM.MD` for the full rationale:
 * >   1. No rotation. Every slot is grid-aligned; `rot`/`ROT_MAX` are gone.
 * >   2. Cards render with rounded corners via a locally-scoped override in
 * >      `cert-wall.css` (`--cw-radius`) — `tokens.css`'s global
 * >      `border-radius: 0 !important` and `tailwind.config.ts` are untouched.
 * > Every other collage module (Projects, Home) keeps the rotated, square-
 * > cornered vocabulary unchanged; this is a single-module deviation, not a
 * > system-wide reversal.
 *
 * Each layout is a flat "bento" composition instead of a rotated pile,
 * spanning the full 12×12 canvas — no reserved masthead band, no derived-
 * stats card, every cell carries a certificate. Slots are discriminated by
 * `kind`:
 *   - `visual` — carries a certificate's scan (`CertScan` + caption)
 *   - `micro`  — carries a certificate's data only, no scan
 *
 * `count` (the ladder key) equals the total slot count — every slot is
 * record-bearing, so it is exactly `perSheet`'s pagination unit.
 *
 * Each `visual` slot declares the orientation it WANTS. Keff's certificates
 * are three portrait A4s and two landscape, so slots are not interchangeable
 * — the same principle as `Project.sheetSlot`. `assignSlots` matches records
 * to slots by scan orientation so a portrait certificate never lands in a
 * cell shaped for a landscape scan. `micro` slots carry no scan, so they
 * have no orientation preference and simply take whatever record is left.
 */

export type Orientation = "portrait" | "landscape";
export type SlotKind = "visual" | "micro";

export interface CertSlot {
  /** `row-start / col-start / row-end / col-end` on the 12×12 grid. */
  area: string;
  kind: SlotKind;
  /** Only meaningful for `kind: "visual"`. Ignored for `micro`. */
  wants?: Orientation;
}

export interface CertLayout {
  slots: CertSlot[];
  /** Tightened at the densest rung of a ladder, where no air is left to spend. */
  gutter?: string;
}

/** Sheet capacity, record-bearing slots only. Past this the page turns. */
export const PER_SHEET_LANDSCAPE = 9;
export const PER_SHEET_PORTRAIT = 6;

/**
 * Landscape ladder — the full 12×12 canvas is content; there is no reserved
 * masthead band and no derived-stats accent slot (2026-08-14: both were
 * chrome, not certificates — `PageLayer`'s own `<h1>` and "BACK / ESC"
 * control already cover what the masthead said, and the pager dots already
 * convey sheet position). Low counts read as a wide hero; high counts read
 * as a dense bento grid. `visual` slots want `landscape` uniformly — a
 * quarter cell's aspect (~1.2 at `--cw-ar` 1.6) sits close to the landscape
 * target, and `object-fit: contain` letterboxes a portrait scan gracefully
 * rather than cropping it.
 */
export const WALL_LANDSCAPE: Record<number, CertLayout> = {
  1: {
    slots: [{ area: "1 / 1 / 13 / 13", kind: "visual", wants: "landscape" }],
  },
  2: {
    slots: [
      { area: "1 / 1 / 13 / 8", kind: "visual", wants: "landscape" },
      { area: "1 / 8 / 13 / 13", kind: "visual", wants: "landscape" },
    ],
  },
  3: {
    slots: [
      { area: "1 / 1 / 13 / 8", kind: "visual", wants: "landscape" },
      { area: "1 / 8 / 7 / 13", kind: "visual", wants: "landscape" },
      { area: "7 / 8 / 13 / 13", kind: "micro" },
    ],
  },
  4: {
    slots: [
      { area: "1 / 1 / 8 / 7", kind: "visual", wants: "landscape" },
      { area: "1 / 7 / 8 / 13", kind: "visual", wants: "landscape" },
      { area: "8 / 1 / 13 / 7", kind: "micro" },
      { area: "8 / 7 / 13 / 13", kind: "micro" },
    ],
  },
  5: {
    slots: [
      { area: "1 / 1 / 8 / 5", kind: "visual", wants: "landscape" },
      { area: "1 / 5 / 8 / 9", kind: "visual", wants: "landscape" },
      { area: "1 / 9 / 8 / 13", kind: "visual", wants: "landscape" },
      { area: "8 / 1 / 13 / 7", kind: "micro" },
      { area: "8 / 7 / 13 / 13", kind: "micro" },
    ],
  },
  6: {
    slots: [
      { area: "1 / 1 / 8 / 5", kind: "visual", wants: "landscape" },
      { area: "1 / 5 / 8 / 9", kind: "visual", wants: "landscape" },
      { area: "1 / 9 / 8 / 13", kind: "visual", wants: "landscape" },
      { area: "8 / 1 / 13 / 5", kind: "micro" },
      { area: "8 / 5 / 13 / 9", kind: "micro" },
      { area: "8 / 9 / 13 / 13", kind: "micro" },
    ],
  },
  7: {
    slots: [
      { area: "1 / 1 / 7 / 7", kind: "visual", wants: "landscape" },
      { area: "1 / 7 / 7 / 13", kind: "visual", wants: "landscape" },
      { area: "7 / 1 / 10 / 5", kind: "micro" },
      { area: "7 / 5 / 10 / 9", kind: "micro" },
      { area: "7 / 9 / 10 / 13", kind: "micro" },
      { area: "10 / 1 / 13 / 7", kind: "micro" },
      { area: "10 / 7 / 13 / 13", kind: "micro" },
    ],
  },
  8: {
    slots: [
      { area: "1 / 1 / 8 / 4", kind: "visual", wants: "landscape" },
      { area: "1 / 4 / 8 / 7", kind: "visual", wants: "landscape" },
      { area: "1 / 7 / 8 / 10", kind: "visual", wants: "landscape" },
      { area: "1 / 10 / 8 / 13", kind: "visual", wants: "landscape" },
      { area: "8 / 1 / 13 / 4", kind: "micro" },
      { area: "8 / 4 / 13 / 7", kind: "micro" },
      { area: "8 / 7 / 13 / 10", kind: "micro" },
      { area: "8 / 10 / 13 / 13", kind: "micro" },
    ],
    gutter: ".85cqw",
  },
  9: {
    slots: [
      { area: "1 / 1 / 6 / 7", kind: "visual", wants: "landscape" },
      { area: "1 / 7 / 6 / 13", kind: "visual", wants: "landscape" },
      { area: "6 / 1 / 9 / 5", kind: "visual", wants: "landscape" },
      { area: "6 / 5 / 9 / 9", kind: "visual", wants: "landscape" },
      { area: "6 / 9 / 9 / 13", kind: "visual", wants: "landscape" },
      { area: "9 / 1 / 13 / 4", kind: "micro" },
      { area: "9 / 4 / 13 / 7", kind: "micro" },
      { area: "9 / 7 / 13 / 10", kind: "micro" },
      { area: "9 / 10 / 13 / 13", kind: "micro" },
    ],
    gutter: ".85cqw",
  },
};

/**
 * Portrait ladder — content area split into two half-columns (cols 1–7 /
 * 7–13) instead of four; a portrait sheet is too narrow for quarter cells.
 * Row-bands are sized per count, growing denser toward the bottom of the
 * ladder. No reserved masthead band and no accent slot — see the landscape
 * ladder's header note for why.
 */
export const WALL_PORTRAIT: Record<number, CertLayout> = {
  1: {
    slots: [{ area: "1 / 1 / 13 / 13", kind: "visual", wants: "landscape" }],
  },
  2: {
    slots: [
      { area: "1 / 1 / 7 / 13", kind: "visual", wants: "landscape" },
      { area: "7 / 1 / 13 / 13", kind: "visual", wants: "landscape" },
    ],
  },
  3: {
    slots: [
      { area: "1 / 1 / 8 / 13", kind: "visual", wants: "landscape" },
      { area: "8 / 1 / 13 / 7", kind: "micro" },
      { area: "8 / 7 / 13 / 13", kind: "micro" },
    ],
  },
  4: {
    slots: [
      { area: "1 / 1 / 8 / 7", kind: "visual", wants: "landscape" },
      { area: "1 / 7 / 8 / 13", kind: "visual", wants: "landscape" },
      { area: "8 / 1 / 13 / 7", kind: "micro" },
      { area: "8 / 7 / 13 / 13", kind: "micro" },
    ],
  },
  5: {
    slots: [
      { area: "1 / 1 / 6 / 7", kind: "visual", wants: "landscape" },
      { area: "1 / 7 / 6 / 13", kind: "visual", wants: "landscape" },
      { area: "6 / 1 / 10 / 7", kind: "micro" },
      { area: "6 / 7 / 10 / 13", kind: "micro" },
      { area: "10 / 1 / 13 / 13", kind: "micro" },
    ],
    gutter: ".85cqw",
  },
  6: {
    slots: [
      { area: "1 / 1 / 6 / 7", kind: "visual", wants: "landscape" },
      { area: "1 / 7 / 6 / 13", kind: "visual", wants: "landscape" },
      { area: "6 / 1 / 9 / 7", kind: "micro" },
      { area: "6 / 7 / 9 / 13", kind: "micro" },
      { area: "9 / 1 / 13 / 7", kind: "micro" },
      { area: "9 / 7 / 13 / 13", kind: "micro" },
    ],
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

/** Every slot in a layout carries a record — kept as its own accessor since
 * callers used to need it to exclude the (now-removed) accent slot. */
export function recordSlots(layout: CertLayout): CertSlot[] {
  return layout.slots;
}

/**
 * Match records to record-bearing slots, preserving reading order as far as
 * the shapes allow. Greedy and stable: a `visual` slot takes the first
 * unused record whose scan orientation matches `wants`, then falls back to
 * the first unused record of any orientation; a `micro` slot (no `wants`)
 * always takes the first unused record. So a set with no portrait scans
 * still fills every slot.
 *
 * `slots` are the layout's record-bearing slots (`recordSlots`) — every slot
 * in a layout carries a record, so this is currently the full slot list.
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
    let pick = slot.wants
      ? orientations.findIndex((o, i) => !used[i] && o === slot.wants)
      : -1;
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
      const records = recordSlots(layout);

      if (Number(count) !== records.length) {
        throw new Error(`${id}: declares ${records.length} record-bearing slots`);
      }

      const named: Array<[string, string]> = layout.slots.map(
        (s, i) => [`${s.kind}${i + 1}`, s.area] as [string, string],
      );

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
