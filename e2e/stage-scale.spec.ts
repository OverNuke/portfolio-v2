import { expect, test } from "@playwright/test";
import { gotoHome } from "./helpers";

/**
 * Task 4.2, replacing the deleted `project-zoom.spec.ts` (the old disc
 * in-place-zoom trigger doesn't exist in this generation). Makes D8's
 * scale mechanism directly observable — batch 5's audit run caught it
 * wired up nowhere at all (task 4.1); this is the regression guard.
 */

const STAGES: Array<{ path: string; stage: string }> = [
  { path: "/projects", stage: ".projects__stage" },
  { path: "/certifications", stage: ".distinction__stage" },
  { path: "/contact", stage: ".contact__dock" },
];

for (const { path, stage } of STAGES) {
  test(`${path} scales its stage to width/1440 in the 1100-1439px range`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoHome(page);
    await page.goto(path);
    await expect(page.getByTestId("page-layer")).toBeVisible();

    const matrix = await page.locator(stage).evaluate((el) => getComputedStyle(el).transform);
    // matrix(sx, 0, 0, sy, tx, ty) — sx is the 1st numeric component.
    const sx = Number(matrix.match(/matrix\(([-\d.]+),/)?.[1]);
    expect(sx).toBeCloseTo(1280 / 1440, 2);
  });
}

test("/projects renders at literal scale at exactly 1440px (clamped, not upscaled)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoHome(page);
  await page.goto("/projects");
  await expect(page.getByTestId("page-layer")).toBeVisible();

  const transform = await page.locator(".projects__stage").evaluate((el) => getComputedStyle(el).transform);
  expect(transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
});
