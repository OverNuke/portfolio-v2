import { expect, test } from "@playwright/test";
import { gotoHome } from "./helpers";

/**
 * Task 4.2 (sdd/phase4-audit-e2e-docs), design #68 Testing Strategy row:
 * "no shell scroll >768px; no h-overflow at 320px; page body scrolls
 * while the content wrapper is clipped." scripts/audit.mjs deliberately
 * does not check these — design calls them out as e2e-only criteria.
 */

test.describe("no shell-level scroll above 768px", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("the shell never grows a scrollbar of its own", async ({ page }) => {
    await gotoHome(page);

    const overflowing = await page.locator(".shell").evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(overflowing).toBe(false);
  });
});

test.describe("no horizontal overflow at 320px", () => {
  test.use({ viewport: { width: 320, height: 700 } });

  test("the document never scrolls sideways", async ({ page }) => {
    await gotoHome(page);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });
});

test("an open page's content wrapper scrolls internally while staying clipped open", async ({ page }) => {
  await gotoHome(page);

  await page.locator('[data-page="profile"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const content = page.locator(".page-content");
  await expect(content).toHaveCSS("overflow-y", "auto");
  await expect(content).toHaveCSS("clip-path", "inset(0px)");
});
