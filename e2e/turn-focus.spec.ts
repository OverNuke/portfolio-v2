import { expect, test } from "@playwright/test";
import { gotoHome, preparePage } from "./helpers";

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

  await page.locator('[data-page="profile"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".shell")).toHaveAttribute("inert", "");

  // Tab through the whole page; focus must never land back on a nav item —
  // `inert` removes the shell from the tab order entirely.
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    const onNavItem = await page.evaluate(
      () => document.activeElement?.classList.contains("nav-item") ?? false,
    );
    expect(onNavItem).toBe(false);
  }
});

test("closing a page returns focus to the exact opener", async ({ page }) => {
  await gotoHome(page);

  await page.locator('[data-page="skills"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.locator(".page-close").click();
  await expect(page.locator(".shell")).not.toHaveAttribute("inert", "");

  const focusedPageId = await page.evaluate(() => document.activeElement?.getAttribute("data-page"));
  expect(focusedPageId).toBe("skills");
});

test("deep link with no opener falls back to #main-content on close", async ({ page }) => {
  await preparePage(page);
  await page.goto("/skills");
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.locator(".page-close").click();

  const focusedId = await page.evaluate(() => document.activeElement?.id);
  expect(focusedId).toBe("main-content");
});

test("direct page-to-page navigation keeps the shell inert and never reveals Home", async ({ page }) => {
  // Real motion (not reduced) for this one test — it needs the actual
  // forward-page clip-path timing to exercise the "layer stays pinned
  // open, only the content wrapper clips" invariant (design D3).
  await gotoHome(page, { reducedMotion: false });

  await page.locator('[data-page="profile"]').click();
  await expect(page.locator(".page-title")).toHaveText("PROFILE");

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
