import { chromium } from "@playwright/test";
import { build, preview } from "vite";

/**
 * Task 4.1: rebuilt against the new DOM (old script deleted Phase 0 with
 * the src/ generation it audited). Builds + previews the real app, drives
 * Chromium via `@playwright/test`'s re-export (not a top-level `playwright`
 * dep — pnpm won't resolve it for a root script), asserts no occlusion, no
 * undersized target, no clipped text at 4 widths (D8) on all 5 routes.
 */
const WIDTHS = [1440, 1280, 1100, 390];
const VIEWPORT_HEIGHT = 900;
const INTERACTIVE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';
const ROUTES = ["/", "/profile", "/certifications", "/projects", "/contact"];

let failures = 0;

function fail(route, width, reason, detail) {
  failures += 1;
  console.error(`[FAIL] ${route} ${width}px — ${reason}: ${detail}`);
}

// page.evaluate serializes each function alone (no shared closure), so each
// carries its own describe() copy instead of calling a hoisted helper.

/** In-page center-point hit-test; recovers from a scrolled-off center
 * (sections scroll internally, D8) before a null hit counts as real. */
function checkOcclusion(selector) {
  const describe = (node) => {
    if (!(node instanceof Element)) return String(node);
    const id = node.id ? `#${node.id}` : "";
    const cls = node.className && typeof node.className === "string" ? `.${node.className.split(" ").join(".")}` : "";
    return `${node.tagName.toLowerCase()}${id}${cls}`;
  };
  const results = [];
  for (const el of document.querySelectorAll(selector)) {
    if (el.closest("[inert]")) continue; // AppShell keeps Home mounted-but-inert behind every page
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
}

/** Unrotated layout box (offsetWidth/Height, not the rotated bounding box
 * Projects' cards would give getBoundingClientRect). Floor matches
 * tokens.css's `--hit-min: 24px` (WCAG 2.2 SC 2.5.8). */
function checkTargetSize(selector) {
  const describe = (node) => {
    const id = node.id ? `#${node.id}` : "";
    const cls = node.className && typeof node.className === "string" ? `.${node.className.split(" ").join(".")}` : "";
    return `${node.tagName.toLowerCase()}${id}${cls}`;
  };
  const results = [];
  for (const el of document.querySelectorAll(selector)) {
    if (el.closest("[inert]")) continue;
    if (el.offsetWidth < 24 || el.offsetHeight < 24) {
      results.push(`${describe(el)} (${el.offsetWidth}x${el.offsetHeight})`);
    }
  }
  return results;
}

/** overflow:hidden elements whose scroll content exceeds their box, minus
 * 1x1px visually-hidden-label spans. Section roots set `overflow: hidden
 * auto` (D8) — that computes to "hidden auto", not "hidden", so scroll
 * containers never match. */
function checkClippedText() {
  const describe = (node) => {
    const id = node.id ? `#${node.id}` : "";
    const cls = node.className && typeof node.className === "string" ? `.${node.className.split(" ").join(".")}` : "";
    return `${node.tagName.toLowerCase()}${id}${cls}`;
  };
  const results = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("[inert]")) continue;
    if (!el.textContent?.trim()) continue; // no text to clip (Ink Flow's decorative bleed etc.)
    if (el.clientWidth <= 1 || el.clientHeight <= 1) continue;
    if (getComputedStyle(el).overflow !== "hidden") continue;

    const clippedX = el.scrollWidth > el.clientWidth;
    const clippedY = el.scrollHeight > el.clientHeight;
    if (clippedX || clippedY) {
      results.push(`${describe(el)} (scroll ${el.scrollWidth}x${el.scrollHeight} vs client ${el.clientWidth}x${el.clientHeight})`);
    }
  }
  return results;
}

/** Runs the three in-page checks at every spec'd width for whatever route
 * is currently loaded. */
async function auditLoadedRoute(page, route) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
    // Settle before measuring: useStageScale/the colony's rAF loop derive
    // geometry from clientWidth, which needs a resize to be observed and a
    // committed React render before it's correct.
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );

    const occlusions = await page.evaluate(checkOcclusion, INTERACTIVE_SELECTOR);
    for (const { el, reason, hit } of occlusions) {
      fail(route, width, reason, hit ? `${el} hit ${hit}` : el);
    }

    const undersized = await page.evaluate(checkTargetSize, INTERACTIVE_SELECTOR);
    for (const detail of undersized) {
      fail(route, width, "undersized-target", detail);
    }

    const clipped = await page.evaluate(checkClippedText);
    for (const detail of clipped) {
      fail(route, width, "clipped-text", detail);
    }
  }
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
    // Freezes Tier-A ambient animation (R2) so occlusion/clip measurements
    // are taken against a settled frame, not a moving target.
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const route of ROUTES) {
      await page.goto(new URL(route === "/" ? "" : route.slice(1), url).href);
      await auditLoadedRoute(page, route);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  if (failures === 0) {
    console.log(
      `Audit passed: zero occlusions, zero undersized targets, zero clipped text at all ${WIDTHS.length} widths on ${ROUTES.join(", ")}.`,
    );
  } else {
    console.error(
      `Audit failed with ${failures} failure(s) across ${WIDTHS.length} widths on ${ROUTES.join(", ")}.`,
    );
    process.exitCode = 1;
  }
}

await main();
