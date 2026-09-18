import { expect, test } from "@playwright/test";
// D10: e2e/ sits outside tsconfig.json's `include: ["src"]` and
// playwright.config.ts has no `@/` alias — relative imports only.
// dictionary.ts has zero runtime imports, so it's safe to pull into a
// Node-side spec. NAV_ROUTES' path order comes from registry.ts (the real
// source of truth for turn order); labels resolve through the dictionary
// so this file stays immune to future copy changes.
import { DICTIONARIES, type DictionaryKey } from "../src/i18n/dictionary";
import { NAV_ROUTES as ROUTE_ENTRIES } from "../src/routes/registry";
import { gotoHome, preparePage } from "./helpers";

/**
 * Tasks 3.3 + 4.2: rebuilt against the new DOM (`.app-shell`/`[data-testid
 * =home-root|page-layer]`, real `<Link>` nav — no ModuleWheel, retired
 * with the old src/ generation). Covers what vitest can't: real `inert`
 * un-reachability, real focus movement, and typed-URL/deep-link paths.
 */

const NAV_KEY: Record<string, DictionaryKey> = {
  "/profile": "nav.profile",
  "/certifications": "nav.certifications",
  "/projects": "nav.projects",
  "/contact": "nav.contact",
};

const NAV_ROUTES: Array<{ path: string; label: string }> = ROUTE_ENTRIES.map((r) => ({
  path: r.path,
  label: DICTIONARIES.en[NAV_KEY[r.path]],
}));

test("home page loads with the expected document title", async ({ page }) => {
  await gotoHome(page);
  await expect(page).toHaveTitle("Kevin Sebastián Frías García — Archive OS");
});

for (const { path, label } of NAV_ROUTES) {
  test(`Tab+Enter reaches ${path} and Escape returns focus to its nav item`, async ({ page }) => {
    await gotoHome(page);

    const link = page.getByRole("link", { name: label });
    await link.focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByTestId("page-layer")).toBeVisible();
    await expect(page.getByTestId("home-root")).toHaveAttribute("inert", "");

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("home-root")).not.toHaveAttribute("inert", "");
    await expect(link).toBeFocused();
  });
}

test("real Tab traversal from a clean load reaches all 4 nav links in order, and Enter opens the last one", async ({ page }) => {
  await gotoHome(page);

  const seen: string[] = [];
  for (let i = 0; i < 20 && seen.length < NAV_ROUTES.length; i++) {
    await page.keyboard.press("Tab");
    // D10 (b): numeral/arrow are aria-hidden now, so `textContent` would
    // return "01Who me?→" — there's no DOM API for accessible name inside
    // page.evaluate. Read route identity instead via the production
    // `data-turn-open` attribute; NAV_ROUTES' path order carries the same
    // "reached in order" intent as the old label-based assertion.
    const path = await page.evaluate(() => {
      const el = document.activeElement;
      const nav = el?.closest('nav[aria-label="Module navigation"]');
      return nav ? el?.closest("a")?.getAttribute("data-turn-open") ?? null : null;
    });
    if (path && !seen.includes(path)) seen.push(path);
  }

  expect(seen).toEqual(NAV_ROUTES.map((r) => r.path));

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${NAV_ROUTES[NAV_ROUTES.length - 1].path}$`));
});

test("opening a page makes Home unreachable by Tab (inert removes it from tab order)", async ({ page }) => {
  await gotoHome(page);
  await page.getByRole("link", { name: "Projects" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("page-layer")).toBeVisible();

  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    const onHomeNav = await page.evaluate(() => document.activeElement?.closest('[data-testid="home-root"]') !== null);
    expect(onHomeNav).toBe(false);
  }
});

test("deep link opens the page directly, with Home mounted-but-inert", async ({ page }) => {
  await preparePage(page);
  await page.goto("/certifications");
  await expect(page.getByTestId("page-layer")).toBeVisible();
  await expect(page.getByTestId("home-root")).toHaveAttribute("inert", "");
});

// D9/D10 gate: scripts/audit.mjs hardcodes a 24px target-size floor
// (audit.mjs:78) and can't see the scoped 44px nav-row upgrade — this is
// the only check that covers it.
test("each nav row clears the scoped 44px hit-target floor at 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoHome(page);

  for (const { label } of NAV_ROUTES) {
    const box = await page.getByRole("link", { name: label }).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});
