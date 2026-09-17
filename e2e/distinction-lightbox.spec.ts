import { expect, test } from "@playwright/test";
import { gotoHome } from "./helpers";

/**
 * Task 4.2, replacing the deleted `cert-wall.spec.ts` (old `.cw-*` markup
 * is gone). Covers the colony lightbox scenario (D5/D14) real layout can't
 * be faked in jsdom: keyboard open/close, focus return, and the obs #385
 * on-page label rename ("Distinctions", not "CERTIFICATE ARCHIVE").
 */

test("distinction colony renders under its on-page label", async ({ page }) => {
  await gotoHome(page);
  await page.getByRole("link", { name: "Distinctions" }).click();
  await expect(page.getByRole("heading", { name: "Distinctions" })).toBeVisible();
});

test("a colony cell opens its lightbox on Enter and Escape returns focus to the cell", async ({ page }) => {
  await gotoHome(page);
  await page.getByRole("link", { name: "Distinctions" }).click();

  const cell = page.locator(".distinction__cell").first();
  await cell.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(cell).toBeFocused();
});

test("closing the lightbox with Escape does not also turn the page back to Home", async ({ page }) => {
  await gotoHome(page);
  await page.getByRole("link", { name: "Distinctions" }).click();

  const cell = page.locator(".distinction__cell").first();
  await cell.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page).toHaveURL(/\/certifications$/);
});
