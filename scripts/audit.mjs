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
 * the four spec'd viewport widths, asserting three things for every
 * interactive element: no occlusion, no undersized target, no clipped
 * text. A fourth, non-blocking check reports focus-order drift.
 *
 * Audits `/` only — the collage lives there; routed pages are placeholder
 * content out of scope for this script.
 */

const WIDTHS = [1440, 1280, 1100, 390];
const VIEWPORT_HEIGHT = 900;
const INTERACTIVE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

let failures = 0;

function fail(width, reason, detail) {
  failures += 1;
  console.error(`[FAIL] ${width}px — ${reason}: ${detail}`);
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
  const focusOrders = [];

  try {
    const page = await browser.newPage();
    await page.addInitScript(() => sessionStorage.setItem("intro:played", "1"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(url);
    // NameRevealIntro always mounts active=true for its first paint, then an
    // effect flips it off (session-seeded + reduced-motion both apply) and
    // AnimatePresence unmounts it. That flip is async — without waiting for
    // it, every occlusion check below hits the overlay instead of the
    // collage underneath it.
    await page
      .locator(".nri-overlay")
      .waitFor({ state: "detached", timeout: 3000 })
      .catch(() => {});

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });

      const occlusions = await page.evaluate(checkOcclusion, INTERACTIVE_SELECTOR);
      for (const { el, reason, hit } of occlusions) {
        fail(width, reason, hit ? `${el} hit ${hit}` : el);
      }

      const undersized = await page.evaluate(checkTargetSize, INTERACTIVE_SELECTOR);
      for (const detail of undersized) {
        fail(width, "undersized-target", detail);
      }

      const clipped = await page.evaluate(checkClippedText);
      for (const detail of clipped) {
        fail(width, "clipped-text", detail);
      }

      focusOrders.push({ width, order: await page.evaluate(focusOrderSnapshot, INTERACTIVE_SELECTOR) });
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const [first, ...rest] = focusOrders;
  const drifted = rest.filter((entry) => JSON.stringify(entry.order) !== JSON.stringify(first.order));
  if (drifted.length > 0) {
    console.warn(
      `[WARN] focus order differs from ${first.width}px at: ${drifted.map((d) => `${d.width}px`).join(", ")} (non-blocking)`,
    );
  } else {
    console.log(`Focus order identical at all ${WIDTHS.length} widths.`);
  }

  if (failures === 0) {
    console.log(`Audit passed: zero occlusions, zero undersized targets, zero clipped text at all ${WIDTHS.length} widths.`);
  } else {
    console.error(`Audit failed with ${failures} failure(s) across ${WIDTHS.length} widths.`);
    process.exitCode = 1;
  }
}

await main();
