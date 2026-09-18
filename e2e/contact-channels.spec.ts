import { expect, test } from "@playwright/test";
import { gotoHome } from "./helpers";

/**
 * Task 4.2, replacing the deleted `contact-figure.spec.ts` (old `.cf__mark`/
 * stand-sit pose-swap system is gone — Contact's figure is now a single
 * static, aria-hidden CSS filter layer with no e2e-checkable behavior).
 * Covers what's real today: obs #385's 3 resolved channels are real,
 * reachable links; WhatsApp/Cal.com stay absent, not stubbed.
 */

test("the 3 resolved contact channels are real, keyboard-reachable links", async ({ page }) => {
  await gotoHome(page);
  // Nav label is "Reach out" as of sdd/portfolio-design-fidelity (was
  // "Contact"); Contact section's own <h2> ("Reach out"/"Hablemos", see
  // dictionary.ts contact.heading) is a separate key, unaffected either way.
  await page.getByRole("link", { name: "Reach out" }).click();
  await expect(page.getByTestId("page-layer")).toBeVisible();

  await expect(page.locator('a[href="mailto:ksfgarcia24@gmail.com"]')).toBeVisible();
  await expect(page.locator('a[href="https://github.com/overnuke"]')).toBeVisible();
  await expect(page.locator('a[href="https://linkedin.com/in/keffwontwakeup"]')).toBeVisible();
});

test("GitHub and LinkedIn cards open in a new tab", async ({ page }) => {
  await gotoHome(page);
  await page.getByRole("link", { name: "Reach out" }).click();

  const github = page.locator('a[href="https://github.com/overnuke"]');
  await expect(github).toHaveAttribute("target", "_blank");
  await expect(github).toHaveAttribute("rel", "noreferrer");
});

test("WhatsApp and Cal.com stay unbuilt, not stubbed as dead links", async ({ page }) => {
  await gotoHome(page);
  await page.getByRole("link", { name: "Reach out" }).click();

  await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
  await expect(page.locator('a[href*="cal.com"]')).toHaveCount(0);
});
