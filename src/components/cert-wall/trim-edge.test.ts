import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postcss, { type Rule } from "postcss";
import { describe, expect, it } from "vitest";

/**
 * `sdd/distinction-section` (design D1–D8, D10). Source-level invariants for
 * the landscape cert-wall hand-trimmed edge, the hard rest shadow and the
 * filter-chain composition guarantee, plus two regression guards (T3 radius
 * allowlist, T4 zero-rotation / axis-aligned gradients).
 *
 * This file lives in the directory `rotation.test.ts` greps for the parenful
 * CSS transform-function name — it must never spell it. Build from parts if
 * ever needed (see `rotation.test.ts`'s own `BANNED_TRANSFORM`).
 *
 * Every assertion is an invariant with NO cardinality clause: counting
 * declarations in a 1200-line file is how a guard ships permanently red.
 */

const DIR = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = join(DIR, "cert-wall.css");
const css = readFileSync(CSS_PATH, "utf8");
const root = postcss.parse(css);

const LANDSCAPE = '[data-sheet="landscape"]';
const TRIM_SIDES = ["t", "r", "b", "l"] as const;

function allRules(): Rule[] {
  const out: Rule[] = [];
  root.walkRules((r) => {
    out.push(r);
  });
  return out;
}

function landscapeRules(): Rule[] {
  return allRules().filter((r) => r.selector.includes(LANDSCAPE));
}

function ruleBySelector(selector: string): Rule | undefined {
  return allRules().find(
    (r) => r.selector.replace(/\s+/g, " ").trim() === selector,
  );
}

function declMap(rule: Rule | undefined): Map<string, string> {
  const m = new Map<string, string>();
  rule?.walkDecls((d) => {
    m.set(d.prop, d.value);
  });
  return m;
}

const MAT = '.cert-wall[data-sheet="landscape"] .cert-mat';
const MAT_BEFORE = '.cert-wall[data-sheet="landscape"] .cert-mat::before';

describe("cert-wall landscape — asymmetric hand-trimmed ink edge (T1)", () => {
  const mat = declMap(ruleBySelector(MAT));

  it("declares all four --cw-trim-* scalars on the landscape .cert-mat rule", () => {
    for (const side of TRIM_SIDES) {
      expect(mat.has(`--cw-trim-${side}`)).toBe(true);
    }
  });

  it("sets every --cw-trim-* to an absolute px value", () => {
    for (const side of TRIM_SIDES) {
      expect(mat.get(`--cw-trim-${side}`)).toMatch(/^\d+(\.\d+)?px$/);
    }
  });

  it("does not make all four trims equal — the asymmetry IS the design", () => {
    const values = TRIM_SIDES.map((side) => mat.get(`--cw-trim-${side}`));
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it("--cut-edge references each of the four trim scalars", () => {
    const cutEdge = mat.get("--cut-edge") ?? "";
    for (const side of TRIM_SIDES) {
      expect(cutEdge).toContain(`var(--cw-trim-${side})`);
    }
  });

  it("::before insets by all four trims in T-R-B-L order", () => {
    const inset = declMap(ruleBySelector(MAT_BEFORE)).get("inset") ?? "";
    expect(inset).toBe(
      "var(--cw-trim-t) var(--cw-trim-r) var(--cw-trim-b) var(--cw-trim-l)",
    );
  });
});

describe("cert-wall landscape — filter-chain composition guarantee (T2)", () => {
  const filtered = landscapeRules().flatMap((rule) => {
    const found: { selector: string; value: string }[] = [];
    rule.walkDecls("filter", (d) => {
      found.push({ selector: rule.selector, value: d.value });
    });
    return found;
  });

  it("has at least one landscape rule that declares filter (guards an empty sweep)", () => {
    expect(filtered.length).toBeGreaterThan(0);
  });

  it("every landscape filter chain begins with var(--cut-edge)", () => {
    const offenders = filtered.filter(
      (f) => !f.value.replace(/\s+/g, " ").trim().startsWith("var(--cut-edge)"),
    );
    expect(offenders).toEqual([]);
  });

  it("any landscape filter carrying a state shadow lists the hard rest shadow before it", () => {
    const offenders = filtered.filter((f) => {
      const v = f.value.replace(/\s+/g, " ");
      const hasStateShadow = /drop-shadow\([^)]*\d+px[^)]*rgb/.test(v);
      if (!hasStateShadow) return false;
      const hard = v.indexOf("drop-shadow(var(--plate-shadow-hard))");
      const state = v.search(/drop-shadow\([^)]*\d+px [^)]*rgb/);
      return hard === -1 || hard > state;
    });
    expect(offenders).toEqual([]);
  });
});

describe("cert-wall landscape — radius allowlist unbroken (T3, guard — green on arrival)", () => {
  it("declares no border-radius in any [data-sheet=\"landscape\"]-scoped rule", () => {
    const offenders: string[] = [];
    for (const rule of landscapeRules()) {
      rule.walkDecls((d) => {
        if (d.prop.includes("radius")) {
          offenders.push(`${rule.selector} { ${d.prop} }`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe("cert-wall — zero independent-rotation / axis-aligned gradients (T4, guard — green on arrival)", () => {
  const banned = ["rot", "ate"].join("");

  it("has no parenless independent rotate/skew property anywhere in cert-wall.css", () => {
    const offenders: string[] = [];
    root.walkDecls((d) => {
      if (d.prop === banned || d.prop === "skew") {
        offenders.push(`${d.parent && (d.parent as Rule).selector} { ${d.prop} }`);
      }
    });
    expect(offenders).toEqual([]);
  });

  it("has no non-orthogonal linear-gradient angle in any landscape-scoped rule", () => {
    const offenders: string[] = [];
    for (const rule of landscapeRules()) {
      rule.walkDecls((d) => {
        const angles = d.value.match(/linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg/g);
        if (!angles) return;
        for (const match of angles) {
          const deg = Number(match.match(/(-?\d+(?:\.\d+)?)deg/)?.[1]);
          if (deg % 90 !== 0) {
            offenders.push(`${rule.selector} { ${d.prop}: …${deg}deg… }`);
          }
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
