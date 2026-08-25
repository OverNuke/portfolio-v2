import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type Container, type Rule } from "postcss";
import { describe, expect, it } from "vitest";

/* 2026-08-06: Home's placement moved to `home.css` — a new composition on
   a new filename rather than an in-place rewrite of `collage.css`, whose
   grid this Home no longer uses. `collage.css` and `skills-collage.css`
   are both still on disk and BOTH ARE NOW UNREFERENCED (nothing imports
   either); delete them, along with `SkillsCollage.tsx`, `collageSeeds.ts`,
   `useCollageSeed.ts` and `components/skill-badge/`, in a cleanup pass. */
const STYLESHEET_PATHS = [join(__dirname, "home.css")];

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
describe("home.css", () => {
  const root = parse();

  // (a) Every block placed on the canvas must declare a grid-area. The
  // 2026-08-06 "ghost plate" Home is a 4-area grid rather than a 12x12
  // collage, but the rule it enforces is unchanged: placement is CSS's
  // job, declared once, never an inline style. The reserved hero
  // placeholder (the seated-cutout photograph, dropped
  // `sdd/drop-intro-hero-placeholder`, 2026-08-24), the seam and the
  // margin reticles are absolutely positioned instead — they are
  // decorative, aria-hidden, and outside the grid on purpose, which is
  // exactly what check (b) below pins down.
  const PLACEMENT_SELECTORS = [".hm-meta", ".hm-mast", ".hm-role", ".hm-stack"];

  it.each(PLACEMENT_SELECTORS)("%s declares a grid-area", (selector) => {
    let declared = false;
    root.walkRules(selector, (rule) => {
      // Top-level rules only. A breakpoint override that retunes rotation
      // or padding is not a second placement declaration, and demanding
      // grid-area in every one of them would just be noise.
      if (rule.parent?.type !== "root") return;
      if (rule.nodes.some((node) => node.type === "decl" && node.prop === "grid-area")) {
        declared = true;
      }
    });
    expect(declared, `${selector} must declare grid-area in home.css`).toBe(true);
  });

  // (b) No rule anywhere may use pixel top/left placement — grid-area is
  // the only placement mechanism. (`.hero` used to be this check's one
  // documented exception, positioned via the `inset` shorthand rather than
  // `top`/`left` — moot as of 2026-08-03, second pass: `.hero` is gone.)
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
  // interactive (the index plate and the channel strip, both real
  // controls) vs content (identity, stack rail — inert) vs decorative
  // (hero placeholder, seam, margin chrome) — docs/12_COLLAGE_SYSTEM.md's
  // stack-order-follows-meaning rule (interactive > content > decorative).
  // An explicit table, not a single "nav" regex, so a mis-banded new plate
  // fails loudly instead of shipping unenforced.
  const Z_INDEX_BANDS = [
    // 2026-08-10: the painted masthead is DECORATIVE and belongs in the
    // bottom band. Not a demotion — the honest reading: both copies are
    // aria-hidden and the accessible name is the visually hidden <h1>. It
    // is also what makes the composition work: --back at 2, the hero slot
    // at 5, the 10% overprint --over at 8. `.hm-shade` (the contact-shade
    // anti-sticker device the removed photograph stood on) was deleted
    // outright `sdd/drop-intro-hero-placeholder` (design D4) — dropped from
    // this band regex since no rule is left to match.
    { pattern: /hm-(field|hero|mast|kg)/i, min: 1, max: 9 },
    { pattern: /hm-(meta|role|stack)/i, min: 10, max: 19 },
    // The interactive band (20-30) has no member left in this file — the
    // module wheel (formerly `.hm-wheel`/`.hm-gate`/`.hm-advance`) was
    // promoted out to `shell/wheel/wheel.css` on 2026-08-11 and carries its
    // own z-index token (`--z-wheel`) entirely outside this file's bands.
  ];

  /**
   * Every z-index in this file is written as a token or as
   * `calc(var(--token) + N)` — that is the point of the bands, and it is
   * also why the previous version of this check silently passed nothing:
   * `Number("var(--z-plate-decor)")` is NaN, and NaN made every rule an
   * offender the moment the CSS stopped using raw integers. So resolve
   * the tokens from tokens.css first, then band-check the number.
   */
  const Z_TOKENS = (() => {
    const css = readFileSync(join(__dirname, "..", "..", "styles", "tokens.css"), "utf-8");
    const map = new Map<string, number>();
    postcss.parse(css).walkDecls(/^--z-/, (decl) => {
      map.set(decl.prop, Number(decl.value.trim()));
    });
    return map;
  })();

  function resolveZ(value: string): number | null {
    const raw = value.trim();
    if (/^-?\d+$/.test(raw)) return Number(raw);

    const bare = /^var\((--[\w-]+)\)$/.exec(raw);
    if (bare) return Z_TOKENS.get(bare[1]) ?? null;

    const offset = /^calc\(\s*var\((--[\w-]+)\)\s*([+-])\s*(\d+)\s*\)$/.exec(raw);
    if (offset) {
      const base = Z_TOKENS.get(offset[1]);
      if (base === undefined) return null;
      return offset[2] === "+" ? base + Number(offset[3]) : base - Number(offset[3]);
    }
    return null;
  }

  it("z-index values fall within their meaning's band", () => {
    const offenders: string[] = [];
    root.walkDecls("z-index", (decl) => {
      if (!isRule(decl.parent)) return;
      const selector = decl.parent.selector;
      // Pseudo-elements stack inside their own parent's context, so they
      // are not band members — `.hm-plate::before` is the registration
      // pass printed *behind* its plate, at -1 of it.
      if (selector.includes("::")) return;
      const band = Z_INDEX_BANDS.find(({ pattern }) => pattern.test(selector));
      if (!band) return;
      const value = resolveZ(decl.value);
      if (value === null) {
        offenders.push(`${selector}: unresolvable z-index "${decl.value}"`);
        return;
      }
      if (value < band.min || value > band.max) {
        offenders.push(`${selector}: ${decl.value} = ${value} (expected ${band.min}-${band.max})`);
      }
    });
    expect(offenders).toEqual([]);
  });
});

/**
 * Retired from Home on 2026-08-06 and NOT re-pinned here: `.identity-plate`,
 * `.nav-stack`, `.skills-collage`, `.plate-sit`/`.plate-work`/`.plate-detail`,
 * `.socials`, `.serial-block`. They are gone from `collage.css` entirely
 * rather than exempted — see `home.css`'s header for the design record.
 *
 * The shared `.bar--accent` / `.plate` skins (ProfilePage's CTA button,
 * featured ProjectCards) live in `src/styles/plate.css` and are untouched;
 * nothing in this file layers on top of them any more, so their coverage
 * belongs with the pages that actually use them.
 */
