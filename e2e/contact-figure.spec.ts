import { expect, test, type Page } from "@playwright/test";
import { openModule, preparePage } from "./helpers";

/**
 * sdd/contact-portrait-swap. Design #135's "sole mechanical gate" — see its
 * Testing Strategy: `pnpm run audit:collage` never visits `/contact`
 * (discovery #136), so this is the only automated coverage for the
 * ChannelField figure/marker swap. Six assertions per width, all listed in
 * the design as machine-checkable; what is NOT checkable here is whether the
 * marker clears the character's painted silhouette (not just `.cf__figure`'s
 * box) — that is manual sign-off, required at 1440 and 390px before this
 * change is considered done regardless of this spec's result.
 */

const WIDTHS = [1440, 1280, 1100, 390];
const STAND_RATIO = 912 / 1178;
const SIT_RATIO = 1;
const OCCLUDERS = ".cf-card, .cf__conn";

function intersects(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function isInside(inner: DOMRect, outer: DOMRect): boolean {
  return (
    inner.left >= outer.left &&
    inner.right <= outer.right &&
    inner.top >= outer.top &&
    inner.bottom <= outer.bottom
  );
}

async function openContact(page: Page): Promise<void> {
  await preparePage(page);
  await page.goto("/");
  await openModule(page, "contact");
  await page.locator(".cf__figure").waitFor({ state: "visible" });
}

for (const width of WIDTHS) {
  const wide = width >= 900;
  const activeRatio = wide ? STAND_RATIO : SIT_RATIO;
  const activeAsset = wide ? "profile-animate-stand" : "profile-animate-sit";
  const inactiveAsset = wide ? "profile-animate-sit" : "profile-animate-stand";

  test.describe(`contact figure at ${width}px`, () => {
    test.use({ viewport: { width, height: width < 900 ? 844 : 900 } });

    test(`renders the ${wide ? "stand" : "sit"} pose, marker clear of every plate`, async ({ page }) => {
      const requestedUrls: string[] = [];
      page.on("request", (req) => {
        if (/\.(png|jpe?g|webp)$/i.test(req.url())) {
          requestedUrls.push(req.url());
        }
      });

      await openContact(page);
      await page.waitForLoadState("networkidle");

      // (5) exactly one of stand/sit fetched, matching the tier
      const fetchedActive = requestedUrls.some((u) => u.includes(activeAsset));
      const fetchedInactive = requestedUrls.some((u) => u.includes(inactiveAsset));
      expect(fetchedActive, `expected a request for ${activeAsset}`).toBe(true);
      expect(fetchedInactive, `did not expect a request for ${inactiveAsset}`).toBe(false);

      const marker = page.locator(".cf__mark");
      const figure = page.locator(".cf__figure");

      // (1) marker stays absolute, never static
      const position = await marker.evaluate((el) => getComputedStyle(el).position);
      expect(position).toBe("absolute");

      // (6) marker z-index never exceeds --z-plate-decor
      const zPlateDecor = await page.evaluate(() =>
        Number(getComputedStyle(document.documentElement).getPropertyValue("--z-plate-decor").trim()),
      );
      const markerZ = await marker.evaluate((el) => getComputedStyle(el).zIndex);
      if (markerZ !== "auto") {
        expect(Number(markerZ)).toBeLessThanOrEqual(zPlateDecor);
      }

      const markerRect = await marker.evaluate((el) => el.getBoundingClientRect().toJSON());
      const figureRect = await figure.evaluate((el) => el.getBoundingClientRect().toJSON());

      // (3) marker rect lies fully inside the figure's rect
      expect(isInside(markerRect, figureRect)).toBe(true);

      // (4) figure's rect ratio matches the active asset's ratio, +/-1%
      const figureRatio = figureRect.width / figureRect.height;
      expect(figureRatio).toBeGreaterThanOrEqual(activeRatio * 0.99);
      expect(figureRatio).toBeLessThanOrEqual(activeRatio * 1.01);

      // (2) marker never intersects a plate, connector, or floating accent
      const occluderRects = await page
        .locator(OCCLUDERS)
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
      for (const rect of occluderRects) {
        expect(intersects(markerRect, rect)).toBe(false);
      }
    });
  });
}
