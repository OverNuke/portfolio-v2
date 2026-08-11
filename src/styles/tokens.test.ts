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
  ])(
    "%s resolves to a non-empty value",
    (token) => {
      expect(decls.has(token)).toBe(true);
      expect(decls.get(token)?.trim()).not.toBe("");
    },
  );

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
  ];

  it.each(retiredTokens)("no file under src/ references the retired %s token", (token) => {
    const files = collectSourceFiles(SRC_ROOT).filter(
      (f) => /\.(css|tsx?|jsx?)$/.test(f) && f !== join(__dirname, "tokens.test.ts"),
    );
    const offenders = files.filter((f) => readFileSync(f, "utf-8").includes(token));
    expect(offenders).toEqual([]);
  });
});
