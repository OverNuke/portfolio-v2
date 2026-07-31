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

/**
 * Phase 4.2 (sdd/phase4-visual-design), design D1-D4. `.accent-plate` is a
 * NEW, Home-only class layered on top of the shared `.bar--accent` skin
 * (also worn by ProfilePage's CTA button and featured ProjectCards via
 * src/styles/plate.css — discovery/bar-accent-class-collision, #91).
 * `.bar--accent` itself MUST stay byte-identical — the approval test below
 * pins its current declarations so any accidental edit to the shared class
 * fails loudly.
 */
describe("accent-plate (phase 4.2 two-line plate + chrome)", () => {
  const root = parse();

  function declMap(selector: string): Record<string, string> {
    const map: Record<string, string> = {};
    root.walkRules(selector, (rule) => {
      for (const node of rule.nodes) {
        if (node.type === "decl") map[node.prop] = node.value;
      }
    });
    return map;
  }

  // Approval test (D1) — pins the CURRENT, pre-existing `.bar--accent` skin
  // so T2/T3's additive edits cannot silently restructure the shared class
  // that ProfilePage.tsx and ProjectCard.tsx also depend on.
  it("shared `.bar--accent` base skin is untouched by the new accent-plate layer", () => {
    expect(declMap(".bar--accent")).toEqual({
      display: "inline-flex",
      "align-items": "baseline",
      gap: "var(--space-xs)",
      width: "fit-content",
      "max-width": "100%",
      background: "var(--signal-red)",
      color: "var(--paper-white)",
      padding: "5px var(--space-sm)",
      "box-shadow": "var(--plate-shadow-sm)",
      transform: "rotate(var(--rot, 0deg))",
      margin: "0",
    });
    expect(declMap(".bar--accent .k")).toEqual({
      "font-size": "var(--text-micro)",
      "letter-spacing": "var(--track-label)",
      "text-transform": "uppercase",
      opacity: "0.8",
      "white-space": "nowrap",
    });
    expect(declMap(".bar--accent .v")).toEqual({
      "font-family": "var(--font-mono)",
      "font-size": "var(--text-meta)",
      "letter-spacing": "0.06em",
      "text-transform": "uppercase",
      "white-space": "nowrap",
    });
  });

  it("`.accent-plate` supplies a column layout and a positioning context for chrome (D2/D3)", () => {
    const decls = declMap(".accent-plate");
    expect(decls.display).toBe("flex");
    expect(decls["flex-direction"]).toBe("column");
    expect(decls.position).toBe("relative");
  });

  it("`.accent-plate .bar__hype` is a distinct, non-truncated text line (D3)", () => {
    const decls = declMap(".accent-plate .bar__hype");
    expect(decls["text-transform"]).toBe("uppercase");
    expect(decls["white-space"]).not.toBe("nowrap");
  });

  it("chrome brackets on `.accent-plate` are AT-invisible pseudo-elements anchored with `inset`, never top/left (D3)", () => {
    // Chrome may be authored as a shared comma-selector block (shared
    // content/position) PLUS per-pseudo rules (inset) — merge declarations
    // across every rule whose selector LIST includes the pseudo, mirroring
    // how the cascade actually resolves the effective computed style.
    function mergedDecls(pseudoSelector: string): Record<string, string> | undefined {
      let found = false;
      const decls: Record<string, string> = {};
      root.walkRules((rule) => {
        if (!rule.selectors.includes(pseudoSelector)) return;
        found = true;
        for (const node of rule.nodes) {
          if (node.type === "decl") decls[node.prop] = node.value;
        }
      });
      return found ? decls : undefined;
    }

    for (const pseudo of [".accent-plate::before", ".accent-plate::after"]) {
      const decls = mergedDecls(pseudo);
      expect(decls, `${pseudo} rule not found`).toBeDefined();
      expect(decls?.content, `${pseudo} content must be empty string`).toBe('""');
      expect(decls?.inset, `${pseudo} must use the inset shorthand`).toBeDefined();
      expect(decls?.top, `${pseudo} must not declare top`).toBeUndefined();
      expect(decls?.left, `${pseudo} must not declare left`).toBeUndefined();
    }
  });

  it("`.bar--status` and `.bar--build` grow to a 3-row grid-area span for the taller two-line plate (D4)", () => {
    expect(declMap(".bar--status")["grid-area"]).toBe("1 / 8 / 4 / 12");
    expect(declMap(".bar--status")["align-self"]).toBe("center");
    expect(declMap(".bar--build")["grid-area"]).toBe("9 / 7 / 12 / 12");
    expect(declMap(".bar--build")["align-self"]).toBe("center");
  });
});
