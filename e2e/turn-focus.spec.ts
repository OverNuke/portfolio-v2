import { expect, test } from "@playwright/test";
import { gotoHome, preparePage } from "./helpers";

/**
 * Tasks 3.3 + 4.2: rebuilt against the new DOM (`.app-shell`/`[data-testid
 * =home-root|page-layer]`, real `<Link>` nav — no ModuleWheel, retired
 * with the old src/ generation). Covers what vitest can't: real `inert`
 * un-reachability, real focus movement, and typed-URL/deep-link paths.
 */

const NAV_ROUTES: Array<{ path: string; label: string }> = [
  { path: "/profile", label: "Profile" },
  { path: "/certifications", label: "Distinctions" },
  { path: "/projects", label: "Projects" },
  { path: "/contact", label: "Contact" },
];

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
    const name = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.closest('nav[aria-label="Module navigation"]') ? el.textContent?.trim() : null;
    });
    if (name && !seen.includes(name)) seen.push(name);
  }

  expect(seen).toEqual(NAV_ROUTES.map((r) => r.label));

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
