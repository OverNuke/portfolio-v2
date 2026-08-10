import { expect, test } from "@playwright/test";
import { gotoHome } from "./helpers";

/**
 * Task 4.2 (sdd/phase4-audit-e2e-docs), design #68 Testing Strategy row:
 * "Real inert... computed rotate() ≤2° at 1440; 390px transform: none +
 * no overlap." Complements scripts/audit.mjs, which checks occlusion/
 * target-size/clipped-text at these widths but not rotation or overlap.
 */

function rotationDegrees(transform: string): number {
  if (transform === "none") return 0;
  const match = transform.match(/matrix\(([^)]+)\)/);
  if (!match) return 0;
  const [a, b] = match[1].split(",").map(Number);
  return Math.atan2(b, a) * (180 / Math.PI);
}

test.describe("collage rotation cap at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the index plate and its control stay within ±2°", async ({ page }) => {
    await gotoHome(page);

    const selectors = [".hm-plate", ".nav-item"];
    for (const selector of selectors) {
      const transforms = await page.locator(selector).evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).transform),
      );
      for (const transform of transforms) {
        expect(Math.abs(rotationDegrees(transform))).toBeLessThanOrEqual(2);
      }
    }
  });
});

test.describe("collage collapse at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("rotation collapses to zero and plates don't overlap", async ({ page }) => {
    await gotoHome(page);

    const selectors = [".hm-plate", ".nav-item"];
    for (const selector of selectors) {
      const transforms = await page.locator(selector).evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).transform),
      );
      for (const transform of transforms) {
        expect(transform).toBe("none");
      }
    }

    const overlaps = await page.locator(".canvas > *").evaluateAll((els) => {
      const rects = els.map((el) => el.getBoundingClientRect());
      const results: string[] = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const intersects = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          if (intersects) results.push(`${i}-${j}`);
        }
      }
      return results;
    });
    expect(overlaps).toEqual([]);
  });
});
