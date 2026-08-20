/**
 * CERTIFICATE WALL — the layout ladders.
 *
 * Two ladders, because the module must never scroll at 768px and up (Keff,
 * 2026-08-06) and a landscape sheet cannot fill a tablet held in portrait:
 *
 *   W1–W6  landscape sheet, `--cw-ar` 12/7  — desktop and tablet landscape
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
 * > Updated 2026-08-17. Bento redesign of the LANDSCAPE ladder only (desktop
 * > wide/tall-box regime), re-skinning `CertWall` to a Claude-Design bento
 * > mockup (`design_handoff_certificates_bento`) while keeping this module's
 * > count-keyed, data-driven architecture:
 * >   - `WALL_LANDSCAPE` drops the `visual`/`micro` scan-thumbnail split —
 * >     the redesign is text-only on the grid, scans live only in the new
 * >     `CertScanModal`. Slots now carry `tone`/`anatomy` (the bento tile's
 * >     visual family) instead, and `wantsHero` replaces `wants: Orientation`
 * >     as the matching axis, since there's no scan shape to match against
 * >     anymore.
 * >   - `PER_SHEET_LANDSCAPE` drops from 9 to 6 (a 3-row bento rhythm, not
 * >     the old 12×12 dense grid) — today's 9 certificates now page 6+3
 * >     instead of fitting on one sheet. Intentional: this is literally the
 * >     "paged bento" design the handoff names itself after.
 * >   - `WALL_PORTRAIT` is UNCHANGED — still `visual`/`micro`, still
 * >     orientation-matched, still capped at 6. The mockup is desktop/
 * >     landscape-only; the portrait (tablet) ladder keeps its scan
 * >     thumbnails and inherits only the shared tile CSS refresh.
 * >   - The 8px radius allowlist in `cert-wall.css` is reversed for the
 * >     landscape bento tiles specifically (square corners, full mockup
 * >     fidelity) but left in place for `WALL_PORTRAIT` and `CertLedger`,
 * >     which are out of scope for this pass.
 *
 * Each layout is a flat "bento" composition instead of a rotated pile,
 * spanning the full 12×12 canvas — no reserved masthead band, no derived-
 * stats card, every cell carries a certificate. `WALL_PORTRAIT` slots are
 * discriminated by `kind`:
 *   - `visual` — carries a certificate's scan (`CertScan` + caption)
 *   - `micro`  — carries a certificate's data only, no scan
 * `WALL_LANDSCAPE` slots are discriminated by `anatomy` instead (see below)
 * and always render text-only, regardless of whether the record has a scan.
 *
 * `count` (the ladder key) equals the total slot count — every slot is
 * record-bearing, so it is exactly `perSheet`'s pagination unit.
 *
 * `WALL_PORTRAIT`'s `visual` slots declare the orientation they WANT (Keff's
 * certificates are three portrait A4s and two landscape, so slots are not
 * interchangeable — the same principle as `Project.sheetSlot`). `assignSlots`
 * matches records to slots by scan orientation there, and by the `hero` flag
 * for `WALL_LANDSCAPE`'s `wantsHero` slots — never both on the same slot.
 */

export type Orientation = "portrait" | "landscape";
export type SlotKind = "visual" | "micro";

/** The three bento tile fills — `WALL_LANDSCAPE` only. Mapped to real tokens
 * in `cert-wall.css` (never the mockup's own placeholder hex values):
 * light -> --paper-white bg / --ink text, dark -> --ink bg / --ink-inverse
 * text, mid -> --field-olive bg / --paper-white text (Ink on Field Olive is
 * 2.57:1 and banned, so "mid" can never carry dark-toned text). */
export type TileTone = "light" | "mid" | "dark";

/** The three bento tile shapes — `WALL_LANDSCAPE` only, per the handoff's
 * "tile anatomy" section. `standard` is the default when omitted. */
export type TileAnatomy = "standard" | "lead" | "baseline";

export interface CertSlot {
  /** `row-start / col-start / row-end / col-end` on the 12×12 grid. */
  area: string;
  /** `WALL_PORTRAIT` only — which scan-bearing shell to render. Ignored by
   * `WALL_LANDSCAPE`, whose tiles are always text-only. */
  kind?: SlotKind;
  /** `WALL_PORTRAIT` only. Ignored by `WALL_LANDSCAPE`. */
  wants?: Orientation;
  /** `WALL_LANDSCAPE` only. */
  tone?: TileTone;
  /** `WALL_LANDSCAPE` only. Defaults to `"standard"` when omitted. */
  anatomy?: TileAnatomy;
  /** `WALL_LANDSCAPE` only — at most one `true` per rung (enforced by
   * `assertCertLayouts`). Claims the first unused `hero`-flagged record,
   * falling back to positional order when no hero is present on this page. */
  wantsHero?: boolean;
}

export interface CertLayout {
  slots: CertSlot[];
  /** Tightened at the densest rung of a ladder, where no air is left to spend. */
  gutter?: string;
}

/** Sheet capacity, record-bearing slots only. Past this the page turns. */
export const PER_SHEET_LANDSCAPE = 6;
export const PER_SHEET_PORTRAIT = 6;

/**
 * Landscape ladder — bento redesign (2026-08-17). Row-bands approximate the
 * mockup's `1fr 1fr 1.22fr` 3-row grid as three 4-row bands over the shared
 * 12-row canvas (rows 1–5 / 5–9 / 9–13) — the coarser integer grid can't
 * reproduce the `1.22fr` taller third row exactly, and exact reproduction
 * isn't architecturally significant (flagged for visual sign-off, not a
 * blocking concern). One dominant `lead` cell scales down as record count
 * rises; tone counts stay as close to even as the count allows.
 */
export const WALL_LANDSCAPE: Record<number, CertLayout> = {
  1: {
    slots: [
      { area: "1 / 1 / 13 / 13", tone: "light", anatomy: "lead", wantsHero: true },
    ],
  },
  2: {
    slots: [
      { area: "1 / 1 / 13 / 8", tone: "light", anatomy: "lead", wantsHero: true },
      { area: "1 / 8 / 13 / 13", tone: "dark", anatomy: "standard" },
    ],
  },
  3: {
    // Shape of the mockup's page 2 — the codebase's own record order (not
    // the mockup's hand-curated one) decides which three certificates land
    // here whenever a page's remainder is exactly 3.
    slots: [
      { area: "1 / 1 / 13 / 6", tone: "light", anatomy: "lead", wantsHero: true },
      { area: "1 / 6 / 9 / 13", tone: "dark", anatomy: "lead" },
      { area: "9 / 6 / 13 / 13", tone: "mid", anatomy: "baseline" },
    ],
  },
  4: {
    slots: [
      { area: "1 / 1 / 8 / 7", tone: "light", anatomy: "lead", wantsHero: true },
      { area: "1 / 7 / 8 / 13", tone: "mid", anatomy: "standard" },
      { area: "8 / 1 / 13 / 7", tone: "dark", anatomy: "standard" },
      { area: "8 / 7 / 13 / 13", tone: "light", anatomy: "standard" },
    ],
  },
  5: {
    slots: [
      { area: "1 / 1 / 13 / 6", tone: "light", anatomy: "lead", wantsHero: true },
      { area: "1 / 6 / 5 / 13", tone: "mid", anatomy: "standard" },
      { area: "5 / 6 / 13 / 9", tone: "dark", anatomy: "standard" },
      { area: "5 / 9 / 9 / 13", tone: "light", anatomy: "standard" },
      { area: "9 / 9 / 13 / 13", tone: "mid", anatomy: "standard" },
    ],
  },
  6: {
    // Shape of the mockup's page 1 — tone balance 2 light / 2 mid / 2 dark,
    // matching the handoff's own table.
    slots: [
      { area: "1 / 1 / 9 / 8", tone: "light", anatomy: "lead", wantsHero: true },
      { area: "1 / 8 / 5 / 13", tone: "mid", anatomy: "standard" },
      { area: "5 / 8 / 9 / 13", tone: "dark", anatomy: "standard" },
      { area: "9 / 1 / 13 / 5", tone: "dark", anatomy: "standard" },
      { area: "9 / 5 / 13 / 9", tone: "light", anatomy: "standard" },
      { area: "9 / 9 / 13 / 13", tone: "mid", anatomy: "standard" },
    ],
  },
};

/**
 * Portrait ladder — content area split into two half-columns (cols 1–7 /
 * 7–13) instead of four; a portrait sheet is too narrow for quarter cells.
 * Row-bands are sized per count, growing denser toward the bottom of the
 * ladder. No reserved masthead band and no accent slot. UNCHANGED by the
 * 2026-08-17 bento pass — see the header note above for why.
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
 * the shapes allow. Greedy and stable, per slot in order:
 *   - `wantsHero` slot (`WALL_LANDSCAPE`) — first unused record with
 *     `hero: true`, falling back to the first unused record when no hero is
 *     present on this page (identical fallback behavior to a plain slot).
 *   - `wants` (orientation) slot (`WALL_PORTRAIT`) — first unused record
 *     whose scan orientation matches, falling back to the first unused
 *     record of any orientation.
 *   - plain slot — first unused record.
 * A slot never sets both `wantsHero` and `wants` — the two ladders use one
 * axis each. So a set with no hero-flagged or no portrait-oriented records
 * still fills every slot.
 *
 * `slots` are the layout's record-bearing slots (`recordSlots`) — every slot
 * in a layout carries a record, so this is currently the full slot list.
 *
 * Returns indices INTO `records`, one per slot.
 */
export function assignSlots(
  records: ReadonlyArray<{ orientation: Orientation; hero: boolean }>,
  slots: ReadonlyArray<CertSlot>,
): number[] {
  const used = new Array(records.length).fill(false);
  const out: number[] = [];

  for (const slot of slots) {
    let pick = -1;
    if (slot.wantsHero) {
      pick = records.findIndex((r, i) => !used[i] && r.hero);
    } else if (slot.wants) {
      pick = records.findIndex((r, i) => !used[i] && r.orientation === slot.wants);
    }
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

      const heroSlots = records.filter((s) => s.wantsHero).length;
      if (heroSlots > 1) {
        throw new Error(`${id}: declares ${heroSlots} wantsHero slots, at most 1 allowed`);
      }

      const named: Array<[string, string]> = layout.slots.map(
        (s, i) => [`${s.anatomy ?? s.kind ?? "slot"}${i + 1}`, s.area] as [string, string],
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
