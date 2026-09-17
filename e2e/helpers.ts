import type { Page } from "@playwright/test";

/**
 * Task 4.2: rebuilt against the new DOM. Reduced motion is opt-out, not
 * opt-in — it removes rAF-driven timing races from focus/geometry
 * assertions. Specs that need real motion pass `reducedMotion: false`.
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
