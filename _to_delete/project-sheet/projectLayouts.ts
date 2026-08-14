/**
 * PROJECT DATABASE — the scatter ladder.
 *
 * Updated 2026-08-12: replaces `sheetLayout.ts`'s `templateFor`/T1–T4 device.
 * See `project-sheet.css`'s header comment for why the tiled-only rule this
 * file used to follow was overturned for this module specifically.
 *
 * Modelled on `src/components/cert-wall/certLayouts.ts` — the closest
 * working precedent for a deterministic, per-record-count, hand-authored
 * layout ladder with build-time assertions, rather than doc 12's
 * weighted-random Skills seeds. Same reasoning applies here: a page that is
 * different every visit reads as broken, not as handmade.
 *
 * SCOPE NOTE — this ladder does NOT let one card's `area` overlap another
 * card's `area`. Every slot stays a distinct, non-overlapping footprint
 * (asserted below), the same guarantee `certLayouts.ts` gives its mats. The
 * "systematic chaos" / overlap this module's redesign actually asks for
 * (docs/design-exploration brief, 2026-08-12) is delivered a different way:
 * irregular, asymmetric block sizes instead of the old evenly-tiled T1–T4
 * grid, whole-panel rotation (new — previously only the image mat inside a
 * panel could rotate, see `ProjectSheet.tsx`), and a decorative giant-type
 * background layer (`.sheet-kg` in `ProjectSheet.tsx`) that panels visually
 * cross over. That layer is `aria-hidden` and sits at the lowest z-band
 * (`--z-plate-decor`), so panels covering it costs nothing — real
 * card-on-card overlap, with the caption-occlusion-safety math that would
 * require, is future scope if the composition ever needs it.
 */

export interface ProjectSlot {
  /** `row-start / col-start / row-end / col-end` on the 12x12 grid. */
  area: string;
  /** Authored per position. |rot| <= ROT_MAX, asserted by `assertProjectLayouts`. */
  rot: number;
}

export interface ProjectLayout {
  /** Metadata + pager. Chrome, not a card — never rotates. */
  pocket: string;
  feature: ProjectSlot;
  /** Absent only on a one-record sheet (`sheetLayout.ts`'s `assignSlots`). */
  spread?: ProjectSlot;
  /** 0–3 type-only slots, matching the ladder. */
  records: ProjectSlot[];
  /** Chrome, not a card — never rotates, same as `pocket`. */
  colophon: string;
}

export const ROT_MAX = 2;

/**
 * One rung per record count, 1 through `RECORDS_PER_SHEET` (5). Feature is
 * always present; spread is present from 2 records up (mirrors
 * `sheetLayout.ts`'s `assignSlots`, which only withholds a spread when
 * there is nothing left to give it).
 */
export const PROJECT_LAYOUTS: Record<number, ProjectLayout> = {
  1: {
    pocket: "1 / 1 / 3 / 13",
    feature: { area: "3 / 2 / 13 / 9", rot: -1.4 },
    records: [],
    colophon: "3 / 9 / 8 / 13",
  },
  2: {
    pocket: "1 / 1 / 3 / 7",
    feature: { area: "3 / 1 / 13 / 7", rot: -1.5 },
    spread: { area: "1 / 7 / 9 / 13", rot: 1.3 },
    records: [],
    colophon: "9 / 7 / 13 / 13",
  },
  // The reference distribution — Keff's live 3-record set (Barbershop /
  // AcopiaTech / Odoo), 2026-08-05.
  3: {
    pocket: "1 / 9 / 5 / 13",
    feature: { area: "2 / 1 / 11 / 7", rot: -1.3 },
    spread: { area: "5 / 7 / 13 / 13", rot: -0.8 },
    records: [{ area: "1 / 7 / 5 / 9", rot: 1.7 }],
    colophon: "11 / 1 / 13 / 7",
  },
  4: {
    pocket: "1 / 10 / 5 / 13",
    feature: { area: "2 / 1 / 9 / 6", rot: -1.6 },
    spread: { area: "5 / 8 / 13 / 13", rot: -0.9 },
    records: [
      { area: "1 / 6 / 5 / 10", rot: 1.4 },
      { area: "9 / 1 / 13 / 5", rot: -1.1 },
    ],
    colophon: "9 / 6 / 13 / 8",
  },
  5: {
    pocket: "1 / 11 / 5 / 13",
    feature: { area: "2 / 1 / 8 / 5", rot: -1.5 },
    spread: { area: "8 / 5 / 13 / 13", rot: -0.9 },
    records: [
      { area: "1 / 5 / 4 / 8", rot: 1.3 },
      { area: "4 / 8 / 8 / 11", rot: -1.2 },
      { area: "8 / 1 / 13 / 5", rot: 1.1 },
    ],
    colophon: "1 / 8 / 4 / 11",
  },
};

/** Sheet capacity. Past this the page turns; the sheet never densifies further. */
export const PROJECT_LAYOUT_CAP = 5;

export function getProjectLayout(count: number): ProjectLayout {
  const n = Math.min(Math.max(count, 1), PROJECT_LAYOUT_CAP);
  return PROJECT_LAYOUTS[n];
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
 * Every card carries a hit target (a link chip, or is inside the tab order
 * via its content), so an overlap here is an occlusion bug, not a style
 * choice — same rule `certLayouts.ts`'s `assertCertLayouts` enforces.
 * Assert it at the data layer rather than trusting the grid-area block;
 * `scripts/audit.mjs` does not currently visit `/projects` (see
 * `ProjectSheet.tsx`'s header comment), so this is the only automated net
 * today, not a second layer over CI coverage that doesn't exist yet.
 */
export function assertProjectLayouts(): void {
  for (const [count, layout] of Object.entries(PROJECT_LAYOUTS)) {
    const expected = 1 + (layout.spread ? 1 : 0) + layout.records.length;
    if (Number(count) !== expected) {
      throw new Error(`Layout ${count}: declares ${expected} card(s)`);
    }

    const cards: Array<[string, ProjectSlot]> = [
      ["feature", layout.feature],
      ...(layout.spread ? ([["spread", layout.spread]] as Array<[string, ProjectSlot]>) : []),
      ...layout.records.map((r, i) => [`record${i + 1}`, r] as [string, ProjectSlot]),
    ];

    for (const [name, slot] of cards) {
      if (Math.abs(slot.rot) > ROT_MAX) {
        throw new Error(`Layout ${count}: ${name} rotation ${slot.rot}deg exceeds +/-${ROT_MAX}deg`);
      }
    }

    const named: Array<[string, string]> = [
      ["pocket", layout.pocket],
      ["colophon", layout.colophon],
      ...cards.map(([name, slot]) => [name, slot.area] as [string, string]),
    ];

    for (const [name, area] of named) {
      const [r1, c1, r2, c2] = parseArea(area);
      if (r1 < 1 || c1 < 1 || r2 > 13 || c2 > 13 || r1 >= r2 || c1 >= c2) {
        throw new Error(`Layout ${count}: ${name} (${area}) is outside the 12x12 grid or inverted`);
      }
    }

    for (let i = 0; i < named.length; i++) {
      for (let j = i + 1; j < named.length; j++) {
        if (overlaps(named[i][1], named[j][1])) {
          throw new Error(
            `Layout ${count}: ${named[i][0]} (${named[i][1]}) overlaps ${named[j][0]} (${named[j][1]})`,
          );
        }
      }
    }
  }
}
