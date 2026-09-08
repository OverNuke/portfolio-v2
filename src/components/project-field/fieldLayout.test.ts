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
  chipAnchor,
  CHIP_DROP,
  CHIP_OUT,
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
  ZOOM_H,
  ZOOM_MAX_SCALE,
  ZOOM_W,
  zoomToCenter,
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

  it("traces the live 3-record rung off the 1440x900 Projects Section artboard", () => {
    // Re-traced 2026-09-07 (sdd/projects-section-design-import) off the new
    // artboard — barbershop 224,126,396²; acopiatech 716,176,228²; odoo
    // 900,298,212² — converted through /1440 (x, d) and /900 (y).
    const rung = FIELD_LAYOUTS[3];
    const [p, a, o] = [rung.primary.shape, rung.secondary[0].shape, rung.secondary[1].shape];

    expect(p).toEqual({ cx: 29.3, cy: 36.0, d: 27.5 });
    expect(a).toEqual({ cx: 57.6, cy: 32.2, d: 15.8 });
    expect(o).toEqual({ cx: 69.9, cy: 44.9, d: 14.7 });

    // Diameters strictly descend — the hierarchy, restated once more here so
    // a bad re-trace of any single disc trips this and not just the deep
    // module-load assertion.
    expect(p.d).toBeGreaterThan(a.d);
    expect(a.d).toBeGreaterThan(o.d);

    // FOOT COLUMNS ARE LOAD-BEARING, NOT A TRANSCRIPTION. They were widened
    // from the raw artboard trace (10/32.1, 47.5/16, 65.6/18.3) so the
    // narrow secondary prose reflows inside the 900-1100px foot-index budget
    // without spilling the stage bottom — a real overflow that is invisible
    // to the audit, e2e and unit layers (`.pf-record__cap` sets no
    // `overflow`, `.page-content` never scrolls). Measured slack at 960px is
    // ~31px; restoring the narrower trace values reintroduces the overflow.
    expect(rung.primary.column).toEqual({ x: 9, w: 33 });
    expect(rung.secondary[0].column).toEqual({ x: 42, w: 19 });
    expect(rung.secondary[1].column).toEqual({ x: 61, w: 22 });

    // Each column still sits under its own disc — the property that makes
    // the foot index read as a hierarchy (stated in three file comments).
    for (const slot of [rung.primary, ...rung.secondary]) {
      expect(slot.column.x).toBeLessThanOrEqual(slot.shape.cx);
      expect(slot.column.x + slot.column.w).toBeGreaterThanOrEqual(slot.shape.cx);
    }
  });

  it("authors the chip side per rung 3 — L, L, R, not the L, R, L of data-side", () => {
    const rung = FIELD_LAYOUTS[3];
    expect([
      rung.primary.chipSide,
      rung.secondary[0].chipSide,
      rung.secondary[1].chipSide,
    ]).toEqual(["L", "L", "R"]);
  });

  it("lets the primary bleed past the band's TOP edge, and only the primary", () => {
    // RELAXED 2026-09-07 (sdd/projects-section-design-import): the invariant
    // no longer asserts a bottom-edge bleed. On the re-traced artboard the
    // primary is TANGENT at the band bottom (58.3% vs 58.0%) — a 0.3%
    // overshoot is noise, not a gesture. The recognisable bleed is the TOP
    // one, and the primary's bottom stays bounded by INDEX_TOP (invariant 3).
    for (const [count, layout] of Object.entries(FIELD_LAYOUTS)) {
      const bandBottom = BAND_TOP + BAND_H;
      expect(shapeTop(layout.primary.shape), `rung ${count} primary top`).toBeLessThan(BAND_TOP);

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
      // Re-validated 2026-09-07 against the CHECK ORDER, not just the
      // invariant named: under INDEX_TOP=63 the old fixture primary
      // {27,41.5,42} has bottom 75.5 and threw `/reaches the foot index/`
      // from the per-slot loop before the column loop ran. These numbers
      // clear every per-slot check (bottoms 58.3 / 52.4) so the column
      // overlap (x=20 < edge=64) is what actually fires.
      "caption columns on top of each other",
      2,
      {
        primary: { shape: { cx: 27, cy: 34.4, d: 29.5 }, column: { x: 4, w: 60 } },
        secondary: [{ shape: { cx: 68, cy: 37, d: 19 }, column: { x: 20, w: 40 } }],
      },
      /overlaps the one before it/,
    ],
    [
      "a primary that has shrunk back inside the band's top edge",
      1,
      {
        primary: { shape: { cx: 30, cy: 40, d: 20 }, column: { x: 4, w: 44 } },
        secondary: [],
      },
      /no longer bleeds past the band's top edge/,
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
    // `clip-path: none !important` on `.pf-shape` would turn every disc —
    // the composition's whole subject — into a rectangle for every
    // reduced-motion user, which is exactly the audience least likely to
    // report it. The reset exists (the wipe animates a clip-path, so it
    // has to), but it may only ever name the wipe carriers. Checked
    // structurally rather than by slicing the media block, so Prettier
    // reformatting cannot quietly disarm this.
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

describe("the /projects restyle CSS contract (sdd/projects-section-design-import)", () => {
  const poster = () => {
    const rules = readRules();
    const at = rules.indexOf("@media (max-width: 900px)");
    return { desktop: rules.slice(0, at), posterBlock: rules.slice(at) };
  };

  it("gates the foot column by CSS display — __sub dormant at desktop, restored only in the poster block", () => {
    const { desktop, posterBlock } = poster();

    // Desktop: `.pf-record__sub` joins the dormant `display: none` list;
    // `.pf-record__prose` / `.pf-record__marker` are shown (never dormant).
    expect(desktop).toMatch(/\.pf-record__sub[^{}]*\{[^}]*display:\s*none/);
    expect(desktop).not.toMatch(/\.pf-record__prose[^{}]*\{[^}]*display:\s*none/);
    expect(desktop).not.toMatch(/\.pf-record__marker[^{}]*\{[^}]*display:\s*none/);

    // Poster (<=900px): the mirror image — `.pf-record__sub` back to
    // `display: block`, the two new nodes killed.
    expect(posterBlock).toMatch(/\.pf-record__sub[^{}]*\{[^}]*display:\s*block/);
    expect(posterBlock).toMatch(/\.pf-record__prose[^{}]*\{[^}]*display:\s*none/);
    expect(posterBlock).toMatch(/\.pf-record__marker[^{}]*\{[^}]*display:\s*none/);
  });

  it("keeps .pf__tone out of every motion list — its clip-path would dissolve to a rectangle", () => {
    // D8: `.pf__tone` carries `clip-path: circle(closest-side)`. In the wipe
    // list a wipe's clip-path replaces the circle; in the reduced-motion
    // `clip-path: none !important` reset it dissolves permanently. It
    // belongs in NEITHER — it arrives with its poster, unanimated. The
    // existing "clip-path reset reach the shapes" test does NOT protect it
    // (`.pf__tone` is not `.pf-shape`).
    const rules = readRules();
    for (const rule of rules.split("}")) {
      if (rule.includes("pf-wipe")) {
        expect(rule, "wipe list names .pf__tone").not.toContain(".pf__tone");
      }
      if (rule.includes("clip-path: none !important")) {
        expect(rule, "reduced-motion reset names .pf__tone").not.toContain(".pf__tone");
      }
    }
    // And it is positioned/shown only under the traced rung.
    expect(rules).toMatch(/\.pf\[data-layout="3"\][^{]*\.pf__tone/);
  });

  it("hides a zoomed record's own chip so it cannot paint over its own scrim (R7)", () => {
    expect(readRules()).toMatch(
      /\.pf-record\[data-zoom="self"\]\s+\.pf-record__chip\s*\{[^}]*visibility:\s*hidden/,
    );
  });

  it("paints the band as two torn pseudo-elements, both olive, both polygon-clipped", () => {
    // D4 supersedes the spec's "two band-piece elements queried in the DOM":
    // the split is `::before` / `::after`, so a11y-tree absence is trivial
    // (pseudos never enter it). Verified as stylesheet text instead.
    const rules = readRules();
    expect(rules).toContain(".pf__band::before");
    expect(rules).toContain(".pf__band::after");

    const bandBase = rules.match(/\.pf__band\s*\{[^}]*\}/)?.[0] ?? "";
    expect(bandBase, ".pf__band stops painting the strip").toMatch(/background:\s*none/);

    const pseudoRule =
      rules.match(/\.pf__band::before,\s*\.pf__band::after\s*\{[^}]*\}/)?.[0] ?? "";
    expect(pseudoRule).toMatch(/background:\s*var\(--field-olive/);
    const beforeClip = rules.slice(rules.indexOf(".pf__band::before {"));
    expect(beforeClip).toMatch(/clip-path:\s*polygon\(/);
  });

  it("replaces every raw hex literal with a locked token", () => {
    // Token remap (D "Token remap"): zero new tokens, zero raw hex. Comments
    // are stripped by `readRules`, so a hex in a doc note does not trip this.
    const rules = readRules();
    const hexes = rules.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes).toEqual([]);
  });

  it("keeps the poster-tier primary subtitle pinned to the clamp floor (C1 — specificity, not a dead rule)", () => {
    // `[data-primary="1"] .pf-record__sub` has specificity (0,2,0); the poster
    // `.pf-record__sub` rule is (0,1,0) — media queries add no specificity —
    // so this rule ALSO governs the poster primary (Barbershop) card, holding
    // its subtitle at the clamp floor (~6.5px) while the non-primary cards
    // take the 8.5px poster treatment. The main change briefly deleted it as
    // a "dead desktop rule"; that grew Barbershop's poster subtitle to 8.5px
    // and falsified the spec's "poster tier renders subtitle exactly as
    // before" scenario. It is re-added INSIDE the poster block (where it
    // matters) and MUST NOT reappear at the desktop tier.
    const { desktop, posterBlock } = poster();
    expect(posterBlock).toMatch(
      /\[data-primary="1"\]\s+\.pf-record__sub\s*\{[^}]*font-size:\s*clamp\(6\.5px,\s*0\.7cqw,\s*11px\)/,
    );
    expect(desktop).not.toMatch(/\[data-primary="1"\]\s+\.pf-record__sub\s*\{/);
  });

  it("pins the two-piece band L/R/gap metrics as a CSS contract (W1 — spec: band metrics MUST be tested)", () => {
    // Design D4 gave `--pf-band-l` / `--pf-band-r` no TS twin (no TypeScript
    // consumer), so `project-field.css` is their sole source of truth — which
    // is exactly why they need a regression guard. Values are the file's own;
    // re-tuning the band means updating this assertion in the same commit.
    const css = readCss();
    expect(declared(css, "--pf-band-l")).toBe("7.2%");
    expect(declared(css, "--pf-band-r")).toBe("15.1%");

    // The torn split is two pseudo pieces that meet mid-band with a small
    // gap: `::before` runs from the left edge to `right: 48.84%`, `::after`
    // from `left: 51.7%` to the right edge. Zeroing or dropping either
    // endpoint collapses the split — assert both endpoints and both
    // clip-paths so a one-sided edit fails here.
    const rules = readRules();
    // Match the standalone position rules, not the shared `::before, ::after`
    // fill block (which carries no `left:` / `right:` inset).
    const beforeRule = rules.match(/\.pf__band::before\s*\{[^{}]*right:[^{}]*\}/)?.[0] ?? "";
    const afterRule = rules.match(/\.pf__band::after\s*\{[^{}]*left:[^{}]*\}/)?.[0] ?? "";
    expect(beforeRule).toMatch(/right:\s*48\.84%/);
    expect(beforeRule).toMatch(/clip-path:\s*polygon\([^)]*\)/);
    expect(afterRule).toMatch(/left:\s*51\.7%/);
    expect(afterRule).toMatch(/clip-path:\s*polygon\([^)]*\)/);

    // Both halves carry the olive fill that makes them read as one band.
    const pseudoRule =
      rules.match(/\.pf__band::before,\s*\.pf__band::after\s*\{[^}]*\}/)?.[0] ?? "";
    expect(pseudoRule).toMatch(/background:\s*var\(--field-olive-deep\)/);
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

describe("zoomToCenter", () => {
  // Values traced in the handoff doc (§3.3) for the live 3-record rung —
  // asserted against the design's own worked table, not re-derived here.
  it("matches the worked table for the live 3-record rung", () => {
    // Recomputed 2026-09-07 (sdd/projects-section-design-import, design D6)
    // for the re-traced rung 3. The 3x cap now binds for BOTH secondaries —
    // the cap working, not a regression (it protects the 1-bit halftone
    // plate's dot grid; doc 13).
    const layout = getFieldLayout(3);
    const [primary, acopiaTech, odoo] = [
      layout.primary.shape,
      layout.secondary[0].shape,
      layout.secondary[1].shape,
    ];

    const t1 = zoomToCenter(primary);
    expect(t1.dx).toBeCloseTo(75.3, 1);
    expect(t1.dy).toBeCloseTo(31.4, 1);
    expect(t1.scale).toBeCloseTo(1.841, 3);

    const t2 = zoomToCenter(acopiaTech);
    expect(t2.dx).toBeCloseTo(-48.1, 1);
    expect(t2.dy).toBeCloseTo(69.5, 1);
    expect(t2.scale).toBeCloseTo(3.0, 3);

    const t3 = zoomToCenter(odoo);
    expect(t3.dx).toBeCloseTo(-135.4, 1);
    expect(t3.dy).toBeCloseTo(21.4, 1);
    expect(t3.scale).toBeCloseTo(3.0, 3);
  });

  it("preserves rank in the zoom rather than flattening it — on-screen heights strictly descend", () => {
    // REPLACED 2026-09-07 the old "every shape lands at the same on-screen
    // height" guarantee. With the 3x cap binding for the two smaller discs,
    // ZOOM_H is no longer the term at every rung, so equal on-screen height
    // is NOT guaranteed. The weaker property that survives: the zoom keeps
    // the descending-scale hierarchy (82.0 > 76.8 > 71.4).
    const layout = getFieldLayout(3);
    const heights = [layout.primary, ...layout.secondary].map((slot) => {
      const hPct = slot.shape.d * STAGE_AR;
      return hPct * zoomToCenter(slot.shape).scale;
    });

    expect(heights[0]).toBeCloseTo(82.0, 1);
    expect(heights[1]).toBeCloseTo(76.8, 1);
    expect(heights[2]).toBeCloseTo(71.4, 1);
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i], `height ${i} descends`).toBeLessThan(heights[i - 1]);
    }
  });

  it("caps scale at ZOOM_MAX_SCALE rather than blowing up a very small shape", () => {
    const t = zoomToCenter({ cx: 50, cy: 50, d: 1 });
    expect(t.scale).toBe(ZOOM_MAX_SCALE);
  });

  it("moves a shape's centre to the stage centre, in the figure's own units", () => {
    const t = zoomToCenter({ cx: 30, cy: 40, d: 20 });
    const hPct = 20 * STAGE_AR;
    expect(t.dx).toBeCloseTo(((50 - 30) / 20) * 100, 6);
    expect(t.dy).toBeCloseTo(((50 - 40) / hPct) * 100, 6);
  });

  it("never scales past ZOOM_W or ZOOM_H relative to the shape's own box", () => {
    const layout = getFieldLayout(3);
    for (const slot of [layout.primary, ...layout.secondary]) {
      const t = zoomToCenter(slot.shape);
      const hPct = slot.shape.d * STAGE_AR;
      expect(slot.shape.d * t.scale).toBeLessThanOrEqual(ZOOM_W + 1e-6);
      expect(hPct * t.scale).toBeLessThanOrEqual(ZOOM_H + 1e-6);
    }
  });
});

describe("chipAnchor", () => {
  // Stage-percentage anchor for a disc's annotation chip, fitted to the
  // three traced rung-3 chips (max error ~0.8% of stage — visual only).
  it("keeps the offset ratios small — out past the edge, a little down from the top", () => {
    expect(CHIP_OUT).toBe(0.05);
    expect(CHIP_DROP).toBe(0.115);
  });

  it("anchors an L-side chip off the disc's left edge, in stage percentages", () => {
    // Barbershop {29.3, 36.0, 27.5}, side L. left = 29.3 - 13.75 - 27.5*0.05.
    const anchor = chipAnchor({ cx: 29.3, cy: 36.0, d: 27.5 }, "L");
    expect(anchor.left).toBeCloseTo(14.175, 2);
    expect(anchor.top).toBeCloseTo(18.848, 2);
    expect(anchor).not.toHaveProperty("right");
  });

  it("anchors an R-side chip off the disc's right edge instead", () => {
    // Odoo {69.9, 44.9, 14.7}, side R. right = 100 - (69.9 + 7.35) - 14.7*0.05.
    const anchor = chipAnchor({ cx: 69.9, cy: 44.9, d: 14.7 }, "R");
    expect(anchor.right).toBeCloseTo(22.015, 2);
    expect(anchor.top).toBeCloseTo(35.732, 2);
    expect(anchor).not.toHaveProperty("left");
  });

  it("lands each traced rung-3 chip within 0.8% of stage of the artboard", () => {
    const rung = getFieldLayout(3);
    const barbershop = chipAnchor(rung.primary.shape, "L");
    const acopiatech = chipAnchor(rung.secondary[0].shape, "L");
    const odoo = chipAnchor(rung.secondary[1].shape, "R");

    expect(Math.abs(barbershop.left! - 14.44)).toBeLessThan(0.8);
    expect(Math.abs(barbershop.top - 18.89)).toBeLessThan(0.8);
    expect(Math.abs(acopiatech.left! - 49.72)).toBeLessThan(0.9);
    expect(Math.abs(odoo.right! - 22.08)).toBeLessThan(0.8);
  });

  it("defaults to the left side when no side is given", () => {
    const anchor = chipAnchor({ cx: 40, cy: 40, d: 20 });
    expect(anchor).toHaveProperty("left");
    expect(anchor).not.toHaveProperty("right");
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
