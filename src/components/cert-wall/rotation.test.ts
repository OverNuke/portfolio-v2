import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const DIR = dirname(fileURLToPath(import.meta.url));

// Built from parts rather than spelled out literally, on purpose: a real
// `rg` sweep of this directory (the literal acceptance check named in
// HANDOFF.md §2.4) must return nothing INCLUDING this file's own source —
// spelling the transform function name out here would make this guard
// fail its own rule.
const BANNED_TRANSFORM = ["rot", "ate", "("].join("");

/**
 * D1 (`sdd/design-import-sections`, HANDOFF.md §2.4): zero rotation is
 * non-negotiable across the Record register. This is the acceptance
 * criterion stated verbatim in the handoff — a real-time grep of this whole
 * directory for the CSS transform function name must return nothing —
 * encoded as a real test rather than a manual one-off, so a future edit
 * that reintroduces it fails CI, not just a checklist.
 */
function certWallFiles(): string[] {
  return readdirSync(DIR)
    .filter((name) => /\.(ts|tsx|css)$/.test(name))
    .map((name) => join(DIR, name));
}

describe("cert-wall — zero rotation invariant (D1, §2.4)", () => {
  it("has at least one source file to check (guards against a silently-empty glob)", () => {
    expect(certWallFiles().length).toBeGreaterThan(0);
  });

  it("contains the banned CSS transform function nowhere in this directory, including this test file", () => {
    const offenders: string[] = [];
    for (const file of certWallFiles()) {
      const content = readFileSync(file, "utf8");
      if (content.includes(BANNED_TRANSFORM)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
