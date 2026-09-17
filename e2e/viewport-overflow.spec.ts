import { expect, test } from "@playwright/test";
import { gotoHome } from "./helpers";

/**
 * Task 3.4 (app-shell spec [PW]): D8 — no shell-level scroll >=768px,
 * released below per WCAG 1.4.10. The <768px half asserts what SC 1.4.10
 * actually requires (no horizontal scroll, last content reachable), not
 * which element does the scrolling — D8 blesses internal section scroll
 * (`overflow: hidden auto`), so document-level scroll isn't the signal.
 */

test.describe("no shell-level scroll at >=768px", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("the shell never grows a scrollbar of its own", async ({ page }) => {
    await gotoHome(page);
    const overflowing = await page.locator(".app-shell").evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(overflowing).toBe(false);
  });
});

const ROUTES_AND_LAST_CONTENT: Array<{ path: string; last: string }> = [
  { path: "/", last: 'nav[aria-label="Module navigation"] a' },
  { path: "/profile", last: ".profile__chamber" },
  { path: "/certifications", last: ".distinction__list-item" },
  { path: "/projects", last: ".projects__reflow .projects__card" },
  { path: "/contact", last: ".contact__reflow .contact__card" },
];

test.describe("no-scroll rule releases below 768px", () => {
  test.use({ viewport: { width: 390, height: 500 } });

  for (const { path, last } of ROUTES_AND_LAST_CONTENT) {
    test(`${path}: shell overflow is visible, no horizontal scroll, last content reachable`, async ({ page }) => {
      await gotoHome(page);
      if (path !== "/") {
        await page.goto(path);
        await expect(page.getByTestId("page-layer")).toBeVisible();
      }

      const overflow = await page.locator(".app-shell").evaluate((el) => getComputedStyle(el).overflow);
      expect(overflow).toBe("visible");

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(390);

      const lastEl = page.locator(last).last();
      await lastEl.scrollIntoViewIfNeeded();
      await expect(lastEl).toBeVisible();
    });
  }
});
