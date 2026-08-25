import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { gotoHome } from "./helpers";

/**
 * sdd/animejs-wheel-trigger-drag, Phase 7. Real pointer/geometry drag
 * scenarios for `.wheel-trigger` (`ModuleWheel.tsx`) — the domain jsdom
 * cannot cover (no layout engine, no real mouse/touch pointer). Complements
 * `scripts/audit.mjs`'s own four breakpoints (1440/1280/1100/390 @ 900
 * tall), used identically here so a dragged trigger is checked against the
 * exact same viewports the collage occlusion audit already covers.
 *
 * `gotoHome`'s reduced-motion-by-default (`e2e/helpers.ts`) is kept for
 * every scenario. A drag that ends up needing a boundary CORRECTION (the
 * "past the edge" scenario) is not instant even under reduced motion,
 * discovered empirically here: `Draggable#handleUp` computes a release
 * duration from `durationX = cx === dx ? 0 : settlingDuration - ...`
 * (`draggable.js:1023`) — the zero-duration branch only fires when the
 * drag was already resting exactly at its clamped destination. A real
 * correction (drag released outside `containerBounds`) still animates
 * back over a non-zero duration regardless of the zeroed velocity trio
 * (design D4's "instant settle" claim holds for drags that never leave
 * bounds, not for boundary corrections) — `waitForSettle` below polls
 * instead of asserting immediately post-`mouseup`, so these scenarios
 * aren't racing an animation neither this file nor the design fully
 * pinned the duration of.
 */

const WIDTHS = [1440, 1280, 1100, 390] as const;
const VIEWPORT_HEIGHT = 900;

async function dragTrigger(page: Page, dx: number, dy: number): Promise<void> {
  const trigger = page.locator(".wheel-trigger");
  const box = await trigger.boundingBox();
  if (!box) throw new Error(".wheel-trigger has no bounding box");

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Real intermediate points, well past the default mouse `dragThreshold`
  // (3px) — a single jump would settle nothing (Draggable reads a
  // pointer path, not a teleport).
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(startX + (dx * i) / steps, startY + (dy * i) / steps);
  }
  await page.mouse.up();
}

type Box = { x: number; y: number; width: number; height: number };

/**
 * Waits out a possible boundary-correction release animation before
 * reading `locator`'s bounding box — a fixed wait, not a
 * stops-changing poll: the correction spring's `settlingDuration` is a
 * CONSTANT ~1680ms (`mass:1, stiffness:80, damping:20`, verified directly
 * against `animejs`'s own `spring()`, independent of drag distance — see
 * `draggable.js:222-231`), but `RELEASE_EASE`
 * (`useWheelTriggerDrag.ts`'s house hard-cut cubicBezier) is non-linear
 * enough that a polling "two consecutive reads agree" strategy can catch
 * a mid-animation plateau and report false-settled well before the
 * correction actually finishes — discovered empirically (a -200px
 * overreach was misread as "settled" at a clearly out-of-bounds position
 * this way). A flat wait past the known-constant duration has no such
 * failure mode.
 */
async function waitForSettle(locator: Locator): Promise<Box> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const box = await locator.boundingBox();
  if (!box) throw new Error("locator has no bounding box after settling");
  return box;
}

function withinViewport(box: Box, width: number, height: number): void {
  // 1px tolerance for sub-pixel rounding.
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
}

for (const width of WIDTHS) {
  test.describe(`wheel trigger drag @ ${width}px`, () => {
    test.use({ viewport: { width, height: VIEWPORT_HEIGHT } });

    test("drag within the viewport settles fully in bounds, and the trigger stays clickable", async ({
      page,
    }) => {
      await gotoHome(page);

      await dragTrigger(page, 60, -40);

      const trigger = page.locator(".wheel-trigger");
      const box = await waitForSettle(trigger);
      withinViewport(box, width, VIEWPORT_HEIGHT);

      // Still a real, working trigger after a drag — WCAG 2.5.7's
      // non-dragging path stays available.
      await trigger.click();
      await expect(page.locator(".option-wheel")).toBeVisible();
    });

    test("drag past a viewport edge clamps to the boundary, never clipped off-screen", async ({
      page,
    }) => {
      await gotoHome(page);

      // Past the edge, but by a fixed, realistic amount — not scaled to
      // the viewport (see file header: an extreme overreach still clamps
      // correctly, but the correction animation's duration scales with
      // distance, which isn't this test's concern, and a
      // viewport-proportional overreach made the smallest breakpoint's
      // diagonal correction take longer than `waitForSettle`'s deadline).
      // `.wheel-trigger`'s default position (`wheel.css`) is always near
      // the bottom-left corner regardless of breakpoint, so a fixed
      // top-left-ward drag reliably clears every edge at every width.
      await dragTrigger(page, -200, -200);

      const box = await waitForSettle(page.locator(".wheel-trigger"));
      withinViewport(box, width, VIEWPORT_HEIGHT);
    });
  });
}

test("a genuine drag gesture does not also open the wheel", async ({ page }) => {
  await gotoHome(page);

  await dragTrigger(page, 120, 80);

  await expect(page.locator(".option-wheel")).not.toBeVisible();
  await expect(page.locator(".wheel-trigger")).toBeVisible();
});

test("a dragged position survives open → close → open (offset persists across remount)", async ({
  page,
}) => {
  await gotoHome(page);

  await dragTrigger(page, 90, -50);
  const settled = await waitForSettle(page.locator(".wheel-trigger"));

  // Open (unmounts the trigger button) then close (remounts it).
  await page.locator(".wheel-trigger").click();
  await expect(page.locator(".option-wheel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".wheel-trigger")).toBeVisible();

  const restored = await page.locator(".wheel-trigger").boundingBox();
  if (!restored) throw new Error(".wheel-trigger has no bounding box after remount");

  // 2px tolerance for sub-pixel rounding across the round-trip.
  expect(Math.abs(restored.x - settled.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(restored.y - settled.y)).toBeLessThanOrEqual(2);
});

test("prefers-reduced-motion: reduce settles an in-bounds drag instantly, with no animated release frame", async ({
  page,
}) => {
  await gotoHome(page, { reducedMotion: true });

  const trigger = page.locator(".wheel-trigger");
  const before = await trigger.boundingBox();
  if (!before) throw new Error(".wheel-trigger has no bounding box");

  // Deliberately small and well within bounds: this is the case design D4
  // actually covers (`cx === dx` at release → `durationX = 0`) — see the
  // file header for why an out-of-bounds correction is a different,
  // non-instant case, covered by the "past a viewport edge" tests above
  // via `waitForSettle` instead. Up-and-right, not down: `.wheel`'s
  // default position (`wheel.css`) is `inset-block-end` + `inset-inline-
  // start` — already close to the bottom-left corner — so a downward drag
  // here would itself clip the bottom edge and race the same non-instant
  // correction this test is trying to avoid.
  await dragTrigger(page, 70, -70);

  // No `waitForTimeout` here on purpose — the resting position must
  // already be correct in the very first frame after `mouseup`, not after
  // an eased settle plays out.
  const after = await trigger.boundingBox();
  if (!after) throw new Error(".wheel-trigger has no bounding box");

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");

  expect(after.x).not.toBeCloseTo(before.x, 0);
  withinViewport(after, viewport.width, viewport.height);
});

test.describe("touch", () => {
  test.use({ hasTouch: true });

  test("a tap (no drag) on the 48px touch target still opens the wheel", async ({ page }) => {
    // Per design's Open Question / task 7.6: the library's default touch
    // `dragThreshold` (7) is left untuned unless this observes a real
    // false-drag problem at the trigger's 48px target size.
    await gotoHome(page);

    await page.locator(".wheel-trigger").tap();

    await expect(page.locator(".option-wheel")).toBeVisible();
  });
});
