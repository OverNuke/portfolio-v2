import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type Container, type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const STYLESHEET_PATHS = [join(__dirname, "collage.css"), join(__dirname, "skills-collage.css")];

function parse() {
  const css = STYLESHEET_PATHS.map((path) => readFileSync(path, "utf-8")).join("\n");
  return postcss.parse(css);
}

function isRule(node: Container | undefined): node is Rule {
  return !!node && "selector" in node;
}

/**
 * Task 3.1 (sdd/phase2-app-shell), design D5 ("collage.css is the single
 * placement source of truth" — parsed with postcss, not asserted on
 * inline styles/TS layout tables; regex over CSS is rejected as brittle).
 * These four checks map 1:1 to spec #67's collage-canvas scenarios:
 * grid-area-only placement, the ±2° rotation cap (--rot-max), and the
 * interactive (20-30) z-index band for nav plates.
 */
describe("collage.css", () => {
  const root = parse();

  // (a) Every top-level plate placed on the 12x12 canvas must declare a
  // grid-area — the direct grid children of `.canvas`. `.skills-collage`'s
  // 5 seed modifier classes vary the arrangement *inside* its one fixed
  // grid-area, not the area itself, so only the base class is checked here.
  const PLACEMENT_SELECTORS = [
    ".identity-plate",
    ".nav-stack",
    ".spec-cascade",
    ".cert-field",
    ".skills-collage",
  ];

  it.each(PLACEMENT_SELECTORS)("%s declares a grid-area", (selector) => {
    let found = false;
    root.walkRules(selector, (rule) => {
      found = true;
      const hasGridArea = rule.nodes.some(
        (node) => node.type === "decl" && node.prop === "grid-area",
      );
      expect(hasGridArea, `${selector} must declare grid-area`).toBe(true);
    });
    expect(found, `${selector} rule not found in collage.css`).toBe(true);
  });

  // (b) No rule anywhere may use pixel top/left placement — grid-area is
  // the only placement mechanism (the hero's exception is out of scope).
  it("no rule uses top/left placement", () => {
    const offenders: string[] = [];
    root.walkDecls(/^(top|left)$/, (decl) => {
      const rule = isRule(decl.parent) ? decl.parent.selector : "(unknown)";
      offenders.push(`${rule}: ${decl.prop}`);
    });
    expect(offenders).toEqual([]);
  });

  // (c) Every authored --rot custom property stays within the ±2deg cap
  // (--rot-max, docs/12_COLLAGE_SYSTEM.md).
  it("every --rot custom property stays within the +/-2deg cap", () => {
    const offenders: string[] = [];
    root.walkDecls("--rot", (decl) => {
      const match = /^(-?\d+(?:\.\d+)?)deg$/.exec(decl.value.trim());
      const rule = isRule(decl.parent) ? decl.parent.selector : "(unknown)";
      if (!match) {
        offenders.push(`${rule}: unparseable --rot value "${decl.value}"`);
        return;
      }
      if (Math.abs(Number(match[1])) > 2) {
        offenders.push(`${rule}: ${decl.value}`);
      }
    });
    expect(offenders).toEqual([]);
  });

  // (d) z-index values fall within the band matching what they carry —
  // interactive (nav, cert-plate — both real links/buttons) vs content
  // (skills-collage — non-interactive badges) — docs/12_COLLAGE_SYSTEM.md's
  // stack-order-follows-meaning rule (interactive > content > decorative).
  // An explicit table, not a single "nav" regex, so a mis-banded new plate
  // (e.g. an interactive cert-plate wrongly left in the content band)
  // fails loudly instead of shipping unenforced.
  const Z_INDEX_BANDS = [
    { pattern: /cert-plate/i, min: 20, max: 30 },
    { pattern: /skills-collage/i, min: 10, max: 19 },
    { pattern: /nav/i, min: 20, max: 30 },
  ];

  it("z-index values fall within their meaning's band", () => {
    const offenders: string[] = [];
    root.walkDecls("z-index", (decl) => {
      if (!isRule(decl.parent)) return;
      const selector = decl.parent.selector;
      const band = Z_INDEX_BANDS.find(({ pattern }) => pattern.test(selector));
      if (!band) return;
      const value = Number(decl.value);
      if (Number.isNaN(value) || value < band.min || value > band.max) {
        offenders.push(`${selector}: ${decl.value} (expected ${band.min}-${band.max})`);
      }
    });
    expect(offenders).toEqual([]);
  });
});
