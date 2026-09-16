import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const TOKENS_PATH = join(__dirname, "tokens.css");
const SRC_ROOT = join(__dirname, "..");

function readRootDecls(): Map<string, string> {
  const css = readFileSync(TOKENS_PATH, "utf-8");
  const root = postcss.parse(css);
  const decls = new Map<string, string>();

  root.walkRules(":root", (rule) => {
    rule.walkDecls((decl) => {
      decls.set(decl.prop, decl.value);
    });
  });

  return decls;
}

/** Recursively collects every file under src/, skipping the styles dir itself is unnecessary — we want to scan everything, including tokens.css. */
function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * WCAG 2.x relative-luminance / contrast-ratio pipeline (docs/05_ACCESSIBILITY.MD's
 * method). Reproduces the project's own documented ratios exactly (verified
 * against design #374's table: paper-white/field-olive-deep 7.74:1,
 * ink/paper 14.83:1, oxblood/paper 10.98:1) — see
 * sdd/design-canvas-reconcile-v2 D2 for the derivation.
 */
function hexToLinearChannel(c: number): number {
  const srgb = c / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const clean = hex.trim().replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (
    0.2126 * hexToLinearChannel(r) +
    0.7152 * hexToLinearChannel(g) +
    0.0722 * hexToLinearChannel(b)
  );
}

function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Palette Contrast-Safety Gate (design-tokens-v2, D2 — sdd/design-canvas-reconcile-v2).
 * `kind: "text"` uses the AA 4.5:1 floor; `kind: "non-text"` uses the AA
 * 3.0:1 floor (marks/rules/brackets/fills, never glyph color).
 * `expectPass: false` entries are trip-wires: pairings that MUST stay below
 * their floor, documenting that a color combination is unusable so a future
 * change doesn't "fix" an inconsistency by introducing it. Do not flip an
 * `expectPass: false` row to `true` without a fresh contrast measurement.
 */
type ContrastPair = {
  name: string;
  fg: string;
  bg: string;
  kind: "text" | "non-text";
  expectPass: boolean;
};

const CONTRAST_PAIRS: ContrastPair[] = [
  // Already-adopted pairs (GUARD — must pass immediately, no red step).
  {
    name: "ink on paper (body text)",
    fg: "--ink",
    bg: "--paper",
    kind: "text",
    expectPass: true,
  },
  {
    name: "paper-white on field-olive-deep (masthead field half, the type-bearing default)",
    fg: "--paper-white",
    bg: "--field-olive-deep",
    kind: "text",
    expectPass: true,
  },
  {
    name: "oxblood on paper (accent text)",
    fg: "--oxblood",
    bg: "--paper",
    kind: "text",
    expectPass: true,
  },
  // --olive-mark (D2): non-text-only, contrast dead zone in every text
  // direction. Paper-side corner bracket use (home.css .hm-hero--reserved::before).
  {
    name: "olive-mark on paper-white (corner-bracket paper-side use)",
    fg: "--olive-mark",
    bg: "--paper-white",
    kind: "non-text",
    expectPass: true,
  },
  // Trip-wire: olive-mark on the field surface fails the non-text floor —
  // do NOT apply --olive-mark to the field-side bracket (.hm-hero--reserved::after
  // stays --paper-white). This row documents why.
  {
    name: "olive-mark on field-olive-deep (BANNED — field-side bracket must stay paper-white)",
    fg: "--olive-mark",
    bg: "--field-olive-deep",
    kind: "non-text",
    expectPass: false,
  },
];

describe("tokens.css", () => {
  const decls = readRootDecls();

  it.each([
    "--paper",
    "--paper-white",
    "--font-serif-display",
    "--font-serif-edit",
    "--font-mono",
    "--space-md",
    "--dur-turn",
    "--rot-max",
    "--oxblood",
    "--field-olive-deep",
    "--plate-shadow-hard",
    "--olive-mark",
  ])(
    "%s resolves to a non-empty value",
    (token) => {
      expect(decls.has(token)).toBe(true);
      expect(decls.get(token)?.trim()).not.toBe("");
    },
  );

  describe("Palette Contrast-Safety Gate (design-tokens-v2, D2)", () => {
    it.each(CONTRAST_PAIRS)(
      "$name meets its floor",
      ({ fg, bg, kind, expectPass }) => {
        const fgHex = decls.get(fg);
        const bgHex = decls.get(bg);
        expect(fgHex, `${fg} must be defined in tokens.css`).toBeTruthy();
        expect(bgHex, `${bg} must be defined in tokens.css`).toBeTruthy();

        const floor = kind === "text" ? 4.5 : 3.0;
        const ratio = contrastRatio(fgHex as string, bgHex as string);

        if (expectPass) {
          expect(ratio).toBeGreaterThanOrEqual(floor);
        } else {
          expect(ratio).toBeLessThan(floor);
        }
      },
    );
  });

  const RETIRED_TOKEN_PREFIX = "--color-";
  const retiredTokens = [
    `${RETIRED_TOKEN_PREFIX}paper`,
    `${RETIRED_TOKEN_PREFIX}off-white`,
    // Retired 2026-08-05 with the red family; --oxblood replaces both.
    "--signal-red",
    "--signal-red-text",
    // Retired 2026-08-11: bifurcated with the editorial serif faces added
    // 2026-08-06. --font-mono replaces every former --font-display site
    // (all were tracked uppercase — see src/styles/fonts.css).
    "--font-display",
    // Retired 2026-08-19: lived less than a day. Sanctioned for the
    // certifications doodle mark, then the doodle itself was cut in favor
    // of the module's existing Field Olive corner-mark/registration
    // vocabulary — see cert-wall.css's own header note.
    "--marker-orange",
  ];

  it.each(retiredTokens)("no file under src/ references the retired %s token", (token) => {
    const files = collectSourceFiles(SRC_ROOT).filter(
      (f) => /\.(css|tsx?|jsx?)$/.test(f) && f !== join(__dirname, "tokens.test.ts"),
    );
    const offenders = files.filter((f) => readFileSync(f, "utf-8").includes(token));
    expect(offenders).toEqual([]);
  });
});
