import { expect, test } from "@playwright/test";
import { gotoHome, openModule, preparePage } from "./helpers";

/**
 * Task 4.2 (sdd/phase4-audit-e2e-docs), spec #67 domain "page-turn-navigation"
 * + design #68 Testing Strategy's Playwright row. Covers the browser-only
 * scenarios vitest can't reach: real `inert` reachability, real focus
 * return, and the deep-link/typed-URL paths (no reliable `opener`).
 */

test("home page loads with the expected document title", async ({ page }) => {
  await gotoHome(page);
  await expect(page).toHaveTitle("Kevin Sebastián Frías García — Archive OS");
});

test("opening a page makes the shell inert and unreachable by keyboard", async ({ page }) => {
  await gotoHome(page);

  await openModule(page, "certifications");
  await expect(page.locator(".page-layer")).toBeVisible();
  await expect(page.locator(".shell")).toHaveAttribute("inert", "");

  // Tab through the whole page; focus must never land back on a Home nav
  // row — `inert` removes the shell from the tab order entirely.
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    const onNavItem = await page.evaluate(
      () => document.activeElement?.classList.contains("nav-item") ?? false,
    );
    expect(onNavItem).toBe(false);
  }
});

test("closing a page opened via the wheel returns focus to #main-content", async ({ page }) => {
  await gotoHome(page);

  // The wheel closes itself as soon as the route changes (`ModuleWheel`'s
  // own `useLocation` effect), which detaches the `.option-wheel` node `go()`
  // captured as the opener — by the time the page closes, `document.contains`
  // on that stale opener is false, so `TurnProvider` falls back to
  // `#main-content`, same as the no-opener deep-link case below.
  await openModule(page, "projects");
  await expect(page.locator(".page-layer")).toBeVisible();

  await page.locator(".page-close").click();
  await expect(page.locator(".shell")).not.toHaveAttribute("inert", "");

  const focusedId = await page.evaluate(() => document.activeElement?.id);
  expect(focusedId).toBe("main-content");
});

test("deep link with no opener falls back to #main-content on close", async ({ page }) => {
  await preparePage(page);
  await page.goto("/projects");
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.locator(".page-close").click();
  // Gate on the reverse turn actually settling before reading focus — same
  // synchronisation the wheel-opener case above uses. Without it the focus
  // read can race the un-inert + `#main-content` focus() that `settle()`
  // performs, and observe `document.body` mid-cascade.
  await expect(page.locator(".shell")).not.toHaveAttribute("inert", "");

  const focusedId = await page.evaluate(() => document.activeElement?.id);
  expect(focusedId).toBe("main-content");
});

test("direct page-to-page navigation keeps the shell inert and never reveals Home", async ({ page }) => {
  // Real motion (not reduced) for this one test — it needs the actual
  // forward-page clip-path timing to exercise the "layer stays pinned
  // open, only the content wrapper clips" invariant (design D3).
  await gotoHome(page, { reducedMotion: false });

  await openModule(page, "certifications");
  await expect(page.locator(".page-title")).toHaveText("CERTIFICATE ARCHIVE");

  // Simulates a typed URL / history navigation — no in-app opener.
  await page.goto("/projects");

  // Poll across the ~200ms turn window: the shell must stay inert
  // throughout, i.e. Home is never revealed mid-turn.
  for (let i = 0; i < 8; i++) {
    await expect(page.locator(".shell")).toHaveAttribute("inert", "");
    await page.waitForTimeout(40);
  }

  await expect(page.locator(".page-title")).toHaveText("PROJECT DATABASE");
  await expect(page.locator(".shell")).toHaveAttribute("inert", "");
});
