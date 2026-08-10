import { chromium } from "@playwright/test";
import { build, preview } from "vite";

/**
 * Task 4.1 (sdd/phase4-audit-e2e-docs), spec #67 "Occlusion audit script
 * must exist" + design #68 "## audit.mjs". Standalone script — no shell
 * operators anywhere, so it runs identically on Windows and POSIX/CI.
 *
 * Builds the real app via Vite's JS API, serves it with `preview()`, then
 * drives Chromium (via the `@playwright/test` re-export — do NOT add a
 * top-level `playwright` devDependency; pnpm's strict node_modules only
 * symlinks direct deps, so a root-level script can't resolve it) across
 * the four spec'd viewport widths — repeated once per Skills-collage seed,
 * via `?collageSeed=<id>` — asserting three things for every interactive
 * element: no occlusion, no undersized target, no clipped text. A fourth,
 * non-blocking check reports focus-order drift within each seed.
 *
 * Audits `/` only — the collage lives there; routed pages are placeholder
 * content out of scope for this script.
 */

const WIDTHS = [1440, 1280, 1100, 390];
const VIEWPORT_HEIGHT = 900;
const INTERACTIVE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

// Collapsed to a single pass on 2026-08-06. This list used to mirror
// `collageSeeds.ts`'s SKILLS_SEEDS because Home's badge field picked one
// arrangement at random per mount, so the audit had to pin the pick with
// `?collageSeed=<id>` to be reproducible. The "ghost plate" Home has no
// badge field and no random arrangement — every element is authored — so
// there is exactly one configuration to audit. The label is kept (rather
// than unwinding the loop) purely so the failure messages keep their
// shape; drop it if this ever needs to iterate over something real again.
const SKILLS_SEEDS = ["home"];

let failures = 0;

function fail(seed, width, reason, detail) {
  failures += 1;
  console.error(`[FAIL] seed=${seed} ${width}px — ${reason}: ${detail}`);
}

/** Runs in-page. Center-point hit-test; recovers from a vertically
 * scrolled-off center (legitimate below the shell's 768px scroll-lock
 * release) before treating a null hit as a real failure. */
function checkOcclusion(selector) {
  const results = [];
  for (const el of document.querySelectorAll(selector)) {
    let { left, top, width, height } = el.getBoundingClientRect();
    let cx = left + width / 2;
    let cy = top + height / 2;

    if (cx < 0 || cx >= window.innerWidth) {
      results.push({ el: describe(el), reason: "horizontal-overflow" });
      continue;
    }
    if (cy < 0 || cy >= window.innerHeight) {
      el.scrollIntoView({ block: "center" });
      ({ left, top, width, height } = el.getBoundingClientRect());
      cx = left + width / 2;
      cy = top + height / 2;
    }

    const hit = document.elementFromPoint(cx, cy);
    if (hit === null) {
      results.push({ el: describe(el), reason: "center-outside-viewport-after-scroll" });
      continue;
    }
    if (!(hit === el || el.contains(hit))) {
      results.push({ el: describe(el), reason: "occluded", hit: describe(hit) });
    }
  }
  return results;

  function describe(node) {
    if (!(node instanceof Element)) return String(node);
    const id = node.id ? `#${node.id}` : "";
    const cls = node.className && typeof node.className === "string" ? `.${node.className.split(" ").join(".")}` : "";
    return `${node.tagName.toLowerCase()}${id}${cls}`;
  }
}

/** Runs in-page. Unrotated layout box (offsetWidth/Height), not the
 * rotated bounding box getBoundingClientRect would return. */
function checkTargetSize(selector) {
  const results = [];
  for (const el of document.querySelectorAll(selector)) {
    if (el.offsetWidth < 24 || el.offsetHeight < 24) {
      const id = el.id ? `#${el.id}` : "";
      const cls = el.className && typeof el.className === "string" ? `.${el.className.split(" ").join(".")}` : "";
      results.push(`${el.tagName.toLowerCase()}${id}${cls} (${el.offsetWidth}x${el.offsetHeight})`);
    }
  }
  return results;
}

/** Runs in-page. Any overflow:hidden element, minus the doc 11
 * data-truncate="ellipsis" allow-list and minus elements too small to
 * meaningfully measure (guards Announcer's 1x1 visually-hidden region). */
function checkClippedText() {
  const results = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (el.getAttribute("data-truncate") === "ellipsis") continue;
    if (el.clientWidth <= 1 || el.clientHeight <= 1) continue;
    if (getComputedStyle(el).overflow !== "hidden") continue;
    if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
      const id = el.id ? `#${el.id}` : "";
      const cls = el.className && typeof el.className === "string" ? `.${el.className.split(" ").join(".")}` : "";
      results.push(
        `${el.tagName.toLowerCase()}${id}${cls} (scroll ${el.scrollWidth}x${el.scrollHeight} vs client ${el.clientWidth}x${el.clientHeight})`,
      );
    }
  }
  return results;
}

/** Runs in-page. DOM-order accessible names of every focusable element —
 * compared across widths, reported only, never a hard failure (doc 12). */
function focusOrderSnapshot(selector) {
  return Array.from(document.querySelectorAll(selector)).map((el) => el.textContent?.trim() || "");
}

async function main() {
  await build({ logLevel: "warn" });
  const server = await preview();
  const url = server.resolvedUrls?.local[0];
  if (!url) {
    throw new Error("preview server produced no local URL");
  }

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.addInitScript(() => sessionStorage.setItem("intro:played", "1"));
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const seed of SKILLS_SEEDS) {
      // One `goto` per seed (the seed is only picked once per mount) — the
      // intro-overlay wait must happen after EACH goto, not once overall,
      // or every seed after the first hit-tests against the still-mounted
      // overlay instead of the real collage underneath it.
      await page.goto(`${url}?collageSeed=${seed}`);
      await page
        .locator(".nri-overlay")
        .waitFor({ state: "detached", timeout: 3000 })
        .catch(() => {});

      const focusOrders = [];

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });

        const occlusions = await page.evaluate(checkOcclusion, INTERACTIVE_SELECTOR);
        for (const { el, reason, hit } of occlusions) {
          fail(seed, width, reason, hit ? `${el} hit ${hit}` : el);
        }

        const undersized = await page.evaluate(checkTargetSize, INTERACTIVE_SELECTOR);
        for (const detail of undersized) {
          fail(seed, width, "undersized-target", detail);
        }

        const clipped = await page.evaluate(checkClippedText);
        for (const detail of clipped) {
          fail(seed, width, "clipped-text", detail);
        }

        focusOrders.push({ width, order: await page.evaluate(focusOrderSnapshot, INTERACTIVE_SELECTOR) });
      }

      // Grouped per seed — comparing across seeds would be meaningless
      // (skill badges are non-interactive <li>s so this should hold
      // trivially within a seed, but it's asserted as a hard invariant,
      // same as before seeds existed, just correctly scoped now).
      const [first, ...rest] = focusOrders;
      const drifted = rest.filter((entry) => JSON.stringify(entry.order) !== JSON.stringify(first.order));
      if (drifted.length > 0) {
        console.warn(
          `[WARN] seed=${seed}: focus order differs from ${first.width}px at: ${drifted.map((d) => `${d.width}px`).join(", ")} (non-blocking)`,
        );
      } else {
        console.log(`Seed ${seed}: focus order identical at all ${WIDTHS.length} widths.`);
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  if (failures === 0) {
    console.log(
      `Audit passed: zero occlusions, zero undersized targets, zero clipped text at all ${WIDTHS.length} widths × ${SKILLS_SEEDS.length} seeds.`,
    );
  } else {
    console.error(`Audit failed with ${failures} failure(s) across ${WIDTHS.length} widths × ${SKILLS_SEEDS.length} seeds.`);
    process.exitCode = 1;
  }
}

await main();
