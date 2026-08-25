import type { Page } from "@playwright/test";

/**
 * Task 4.2 (sdd/phase4-audit-e2e-docs). Shared reduced-motion convention,
 * matching scripts/audit.mjs. `NameRevealIntro`'s "intro:played"
 * sessionStorage seed and `.nri-overlay` detached-wait were removed here
 * (sdd/drop-intro-hero-placeholder, 2026-08-24) along with the component
 * itself — there is no overlay left to race.
 *
 * Reduced motion is opt-out, not opt-in, and is retained independently of
 * the intro removal: TurnProvider settles turns synchronously when reduced
 * motion is on, which removes the 200ms SETTLE_MS race from focus
 * assertions. The one spec that needs the real clip-path timing passes
 * `reducedMotion: false` explicitly.
 */
export async function preparePage(page: Page, options: { reducedMotion?: boolean } = {}): Promise<void> {
  const { reducedMotion = true } = options;
  if (reducedMotion) {
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
}

export async function gotoHome(page: Page, options: { reducedMotion?: boolean } = {}): Promise<void> {
  await preparePage(page, options);
  await page.goto("/");
}

/**
 * Opens a module via the global `ModuleWheel` (`src/shell/wheel/`) — Home
 * has no per-item clickable nav rows anymore (that idiom, `NavItem`/
 * `data-page` directly on a grid button, was retired 2026-08-11 when the
 * wheel was promoted to a `.shell`-sibling). The wheel is closed by
 * default (`.wheel-trigger` button); opening it focuses the listbox, and
 * `ArrowDown` steps through options while `data-page` on `.option-wheel`
 * tracks the current selection (`ModuleWheel.tsx`) — stepping to a match
 * and committing with Enter is the one interaction path that works
 * regardless of which route is currently first in `ROUTES`.
 */
export async function openModule(page: Page, pageId: string): Promise<void> {
  const trigger = page.locator(".wheel-trigger");
  if (await trigger.count()) {
    await trigger.click();
  }
  const wheel = page.locator(".option-wheel");
  await wheel.waitFor({ state: "visible" });
  await wheel.focus();

  for (let i = 0; i < 10; i++) {
    if ((await wheel.getAttribute("data-page")) === pageId) break;
    await page.keyboard.press("ArrowDown");
  }

  await page.keyboard.press("Enter");
}
