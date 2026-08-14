import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROJECTS } from "../../content/data";
import type { Project } from "../../content/types";
import {
  assertFieldLayouts,
  assignSlots,
  BAND_H,
  BAND_TOP,
  clampField,
  FIELD_LAYOUTS,
  FIELD_LAYOUT_CAP,
  getFieldLayout,
  INDEX_TOP,
  paginate,
  RECORDS_PER_FIELD,
  shapeBottom,
  shapeTop,
  STAGE_AR,
} from "./fieldLayout";

/**
 * Two jobs here. The first is the ordinary one: slot assignment and
 * pagination are pure functions and should be tested as such.
 *
 * The second is the interesting one. The composition's geometry lives in
 * TWO files — the numbers in `fieldLayout.ts` and the `--pf-*` custom
 * properties in `project-field.css` — because CSS cannot import from
 * TypeScript. A drift between them is invisible in review and silently
 * wrong on screen: a disc quietly overlapping the foot index, or a band
 * whose top edge no longer matches the crop the title was tuned against.
 * The CSS-CONTRACT block below reads the stylesheet as text and asserts
 * the two agree, which is the only place that coupling can be caught
 * automatically.
 */

// `join(__dirname, …)`, not `new URL(…, import.meta.url)`: under the jsdom
// environment `import.meta.url` is an http URL and `fs` refuses it. Same
// path idiom `src/styles/tokens.test.ts` already uses to read its CSS.
const CSS_PATH = join(__dirname, "project-field.css");

function readCss(): string {
  return readFileSync(CSS_PATH, "utf-8");
}

/**
 * The stylesheet is heavily commented and several of those comments name
 * the very selectors the structural checks below forbid — a comment saying
 * "never reset `.pf-shape` here" would fail a naive scan for `.pf-shape`.
 * Strip comments first so the checks look at rules and only at rules.
 */
function readRules(): string {
  return readCss().replace(/\/\*[\s\S]*?\*\//g, "");
}

function declared(css: string, prop: string): string {
  const match = css.match(new RegExp(`${prop}:\\s*([^;]+);`));
  if (!match) throw new Error(`project-field.css declares no ${prop}`);
  return match[1].trim();
}

describe("field layout ladder", () => {
  it("holds every invariant at every rung", () => {
    expect(() => assertFieldLayouts()).not.toThrow();
  });

  it("has one rung per record count up to the cap, and no gaps", () => {
    for (let n = 1; n <= FIELD_LAYOUT_CAP; n++) {
      expect(FIELD_LAYOUTS[n], `rung ${n}`).toBeDefined();
    }
    expect(Object.keys(FIELD_LAYOUTS)).toHaveLength(FIELD_LAYOUT_CAP);
  });

  it("clamps an out-of-range record count onto a real rung instead of returning undefined", () => {
    expect(getFieldLayout(0)).toBe(FIELD_LAYOUTS[1]);
    expect(getFieldLayout(99)).toBe(FIELD_LAYOUTS[FIELD_LAYOUT_CAP]);
  });

  it("keeps the live archive on the rung traced off the reference", () => {
    // If a fourth project is added this fails, which is the point: rung 4
    // exists but has never been looked at on a real screen.
    expect(PROJECTS.length).toBe(3);
    expect(getFieldLayout(PROJECTS.length)).toBe(FIELD_LAYOUTS[3]);
  });

  it("lets the primary bleed past the band, and only the primary", () => {
    // The bleed is the single most recognisable thing about `image_01`.
    // If a refactor ever tucks the primary back inside the band, the
    // composition still passes every other assertion here and no longer
    // looks like the reference at all.
    for (const [count, layout] of Object.entries(FIELD_LAYOUTS)) {
      const bandBottom = BAND_TOP + BAND_H;
      expect(shapeTop(layout.primary.shape), `rung ${count} primary top`).toBeLessThan(BAND_TOP);
      expect(shapeBottom(layout.primary.shape), `rung ${count} primary bottom`).toBeGreaterThan(
        bandBottom,
      );

      for (const [i, slot] of layout.secondary.entries()) {
        expect(shapeTop(slot.shape), `rung ${count} secondary ${i + 1} top`).toBeGreaterThanOrEqual(
          BAND_TOP,
        );
        expect(
          shapeBottom(slot.shape),
          `rung ${count} secondary ${i + 1} bottom`,
        ).toBeLessThanOrEqual(bandBottom);
      }
    }
  });

  it("gives the primary the widest caption column at every rung", () => {
    for (const [count, layout] of Object.entries(FIELD_LAYOUTS)) {
      for (const slot of layout.secondary) {
        expect(layout.primary.column.w, `rung ${count}`).toBeGreaterThan(slot.column.w);
      }
    }
  });

  // The assertions are only worth having if they actually fire, so each
  // one gets a rung deliberately broken in the way it exists to catch.
  // Restored in `finally` so a failure here cannot cascade into the rest
  // of the file.
  it.each([
    [
      "scale that does not descend",
      2,
      {
        primary: { shape: { cx: 27, cy: 41.5, d: 20 }, column: { x: 4, w: 40 } },
        secondary: [{ shape: { cx: 68, cy: 41.5, d: 27 }, column: { x: 55, w: 40 } }],
      },
      /does not descend/,
    ],
    [
      "a shape sitting on the foot index",
      1,
      {
        primary: { shape: { cx: 30, cy: 60, d: 44 }, column: { x: 4, w: 44 } },
        secondary: [],
      },
      /reaches the foot index/,
    ],
    [
      "a shape running off the side of the stage",
      1,
      {
        primary: { shape: { cx: 90, cy: 41.5, d: 44 }, column: { x: 4, w: 44 } },
        secondary: [],
      },
      /leaves the stage horizontally/,
    ],
    [
      "caption columns on top of each other",
      2,
      {
        primary: { shape: { cx: 27, cy: 41.5, d: 42 }, column: { x: 4, w: 60 } },
        secondary: [{ shape: { cx: 68, cy: 41.5, d: 27 }, column: { x: 20, w: 40 } }],
      },
      /overlaps the one before it/,
    ],
  ])("rejects %s", (_label, rung, broken, message) => {
    const original = FIELD_LAYOUTS[rung];
    try {
      FIELD_LAYOUTS[rung] = broken;
      expect(() => assertFieldLayouts()).toThrow(message);
    } finally {
      FIELD_LAYOUTS[rung] = original;
    }
    expect(() => assertFieldLayouts()).not.toThrow();
  });
});

describe("the CSS contract", () => {
  it("declares the same stage aspect the ladder was authored against", () => {
    expect(declared(readCss(), "--pf-ar")).toBe(String(STAGE_AR));
  });

  it("declares the same band geometry the ladder positions shapes against", () => {
    const css = readCss();
    expect(declared(css, "--pf-band-top")).toBe(`${BAND_TOP}%`);
    expect(declared(css, "--pf-band-h")).toBe(`${BAND_H}%`);
  });

  it("declares the same foot-index edge the ladder keeps every disc clear of", () => {
    expect(declared(readCss(), "--pf-index-top")).toBe(`${INDEX_TOP}%`);
  });

  it("never lets a clip-path reset reach the shapes themselves", () => {
    // `clip-path: none !important` on `.pf-shape` would turn every disc and
    // the fused lobe — the composition's whole subject — into a rectangle
    // for every reduced-motion user, which is exactly the audience least
    // likely to report it. The reset exists (the wipe animates a
    // clip-path, so it has to), but it may only ever name the wipe
    // carriers. Checked structurally rather than by slicing the media
    // block, so Prettier reformatting cannot quietly disarm this.
    const rules = readRules();
    expect(rules).toContain("clip-path: none !important");

    // The bare `.pf-shape` selector appears exactly once: the base rule
    // that sets up the box. Everything else targets a variant.
    expect(rules.match(/\.pf-shape\s*[,{]/g) ?? []).toHaveLength(1);

    // And no rule that resets clip-path may name a shape at all.
    for (const rule of rules.split("}")) {
      if (!rule.includes("clip-path: none")) continue;
      expect(rule).not.toContain(".pf-shape");
    }
  });
});

describe("assignSlots", () => {
  it("returns null for an empty field rather than an empty shell", () => {
    expect(assignSlots([])).toBeNull();
  });

  it("takes the explicitly marked feature as the primary, wherever it sits", () => {
    const reversed = [...PROJECTS].reverse();
    expect(assignSlots(reversed)!.primary.title).toBe("Barbershop");
  });

  it("falls back to the first record when nothing is marked", () => {
    const unmarked = PROJECTS.map((p) => ({ ...p, sheetSlot: undefined })) as Project[];
    expect(assignSlots(unmarked)!.primary).toBe(unmarked[0]);
  });

  it("sorts the spread ahead of the plain records in the descending chain", () => {
    const slots = assignSlots(PROJECTS)!;
    expect(slots.secondary.map((p) => p.title)).toEqual(["AcopiaTech", "Odoo Custom Module"]);
  });

  it("accounts for every record exactly once", () => {
    const slots = assignSlots(PROJECTS)!;
    expect([slots.primary, ...slots.secondary]).toHaveLength(PROJECTS.length);
    expect(new Set([slots.primary, ...slots.secondary]).size).toBe(PROJECTS.length);
  });
});

describe("paginate", () => {
  it("keeps the live archive on one field", () => {
    expect(paginate(PROJECTS, RECORDS_PER_FIELD)).toHaveLength(1);
  });

  it("returns one empty field rather than no fields at all", () => {
    expect(paginate([], RECORDS_PER_FIELD)).toEqual([[]]);
  });

  it("chunks past the cap", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ ...PROJECTS[0], title: `P${i}` }));
    const fields = paginate(many, RECORDS_PER_FIELD);
    expect(fields).toHaveLength(3);
    expect(fields[0]).toHaveLength(5);
    expect(fields[2]).toHaveLength(2);
  });

  it("refuses a nonsense page size instead of looping forever", () => {
    expect(() => paginate(PROJECTS, 0)).toThrow(RangeError);
  });
});

describe("clampField", () => {
  it("lands a junk or out-of-range deep link on a real field", () => {
    expect(clampField("banana", 3)).toBe(1);
    expect(clampField("97", 3)).toBe(3);
    expect(clampField("-4", 3)).toBe(1);
    expect(clampField(null, 3)).toBe(1);
  });

  it("never returns zero, even with no fields at all", () => {
    expect(clampField("1", 0)).toBe(1);
  });
});
