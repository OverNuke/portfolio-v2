import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type Container, type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const COLLAGE_PATH = join(__dirname, "collage.css");

function parse() {
  const css = readFileSync(COLLAGE_PATH, "utf-8");
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
  // grid-area — these are the only direct grid children of `.canvas` in
  // the Phase-2 subset (identity, nav-stack, spec-cascade placeholder).
  const PLACEMENT_SELECTORS = [".identity-plate", ".nav-stack", ".spec-cascade"];

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

  // (d) Nav plate z-index values fall within the interactive band
  // (20-30) — docs/12_COLLAGE_SYSTEM.md's stack-order-follows-meaning
  // rule (interactive > content > decorative).
  it("nav z-index values fall within the interactive band (20-30)", () => {
    const offenders: string[] = [];
    root.walkDecls("z-index", (decl) => {
      if (!isRule(decl.parent) || !/nav/i.test(decl.parent.selector)) return;
      const value = Number(decl.value);
      if (Number.isNaN(value) || value < 20 || value > 30) {
        offenders.push(`${decl.parent.selector}: ${decl.value}`);
      }
    });
    expect(offenders).toEqual([]);
  });
});
