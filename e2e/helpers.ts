import type { Page } from "@playwright/test";

/**
 * Task 4.2 (sdd/phase4-audit-e2e-docs). Shared intro-neutralization
 * convention, matching scripts/audit.mjs: NameRevealIntro defaults
 * `persistKey="intro:played"` and also skips on `prefers-reduced-motion`
 * (src/components/name-reveal-intro/NameRevealIntro.tsx). Seeding the
 * session key AND emulating reduced motion means a test never races the
 * intro's own dismiss effect — without this, the overlay occludes every
 * shell element for the first ~1s after load.
 *
 * Reduced motion is opt-out, not opt-in: TurnProvider settles turns
 * synchronously when reduced motion is on, which removes the 200ms
 * SETTLE_MS race from focus assertions. The one spec that needs the real
 * clip-path timing passes `reducedMotion: false` explicitly.
 */
export async function preparePage(page: Page, options: { reducedMotion?: boolean } = {}): Promise<void> {
  const { reducedMotion = true } = options;
  await page.addInitScript(() => sessionStorage.setItem("intro:played", "1"));
  if (reducedMotion) {
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
}

export async function gotoHome(page: Page, options: { reducedMotion?: boolean } = {}): Promise<void> {
  await preparePage(page, options);
  await page.goto("/");
  await page
    .locator(".nri-overlay")
    .waitFor({ state: "detached", timeout: 3000 })
    .catch(() => {});
}
