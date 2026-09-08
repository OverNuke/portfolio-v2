import { expect, test, type Page } from "@playwright/test";
import { gotoHome, openModule } from "./helpers";

/**
 * Task 4.8 (`sdd/design-import-sections`, Phase 4 — Distinctions). Covers
 * the browser-only claims vitest/jsdom cannot: real computed-style rotation
 * (CW1), real Tab-key focus order onto the new "01"/"02" pager tabs (CW5),
 * and whether the new sheet-level arrow-key handler
 * (`useFieldKeyboard` in `CertificationsPage.tsx`, wired for the first time
 * this phase) collides with `CertScanModal`'s own pre-existing capture-phase
 * ArrowRight-to-close handler.
 */

async function openCertifications(page: Page): Promise<void> {
  await gotoHome(page);
  await openModule(page, "certifications");
  await expect(page.locator(".cert-wall, .cert-ledger")).toBeVisible();
}

test("CW1: no tile, tab, or hover state ever computes a rotate() transform", async ({ page }) => {
  await openCertifications(page);

  const tile = page.locator(".cert-mat").first();
  await expect(tile).toBeVisible();

  const baseTransform = await tile.evaluate((el) => getComputedStyle(el).transform);
  expect(baseTransform).not.toMatch(/matrix\(-?\d[\d.]*,\s*-?\d[\d.]*,/); // a rotated 2D matrix has non-zero b/c terms; translate-only or "none" never does

  await tile.hover();
  const hoverTransform = await tile.evaluate((el) => getComputedStyle(el).transform);
  // translateY(-3px) as a matrix is matrix(1, 0, 0, 1, 0, -3) -- b and c
  // (indices 1 and 2) are exactly 0 for a pure translation; any nonzero
  // rotation would make one of them nonzero.
  if (hoverTransform !== "none") {
    const parts = hoverTransform.match(/matrix\(([^)]+)\)/)?.[1].split(",").map(Number);
    expect(parts?.[1]).toBe(0);
    expect(parts?.[2]).toBe(0);
  }

  const tab = page.locator(".cert-pager__tab").first();
  const tabTransform = await tab.evaluate((el) => getComputedStyle(el).transform);
  expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(tabTransform);
});

test("CW3: each pager tab carries a real accessible name beyond the glyph, current one marked aria-current", async ({
  page,
}) => {
  await openCertifications(page);

  const tabs = page.locator(".cert-pager__tab");
  await expect(tabs).toHaveCount(2);

  await expect(page.getByText(/sheet 1, current/i)).toBeAttached();
  await expect(page.getByRole("link", { name: /sheet 2/i })).toBeVisible();

  const current = page.locator('[aria-current="page"]');
  await expect(current).toHaveCount(1);
});

test("CW4/CW5: the '02' tab is a real route link, reachable and activatable via Tab+Enter, and browser back/forward both work", async ({
  page,
}) => {
  await openCertifications(page);
  expect(page.url()).toMatch(/\/certifications$/);

  const nextTab = page.getByRole("link", { name: /sheet 2/i });
  await nextTab.focus();
  await expect(nextTab).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/certifications\/2$/);
  await expect(page.getByText(/sheet 2, current/i)).toBeAttached();

  await page.goBack();
  await expect(page).toHaveURL(/\/certifications$/);
  await expect(page.getByText(/sheet 1, current/i)).toBeAttached();

  await page.goForward();
  await expect(page).toHaveURL(/\/certifications\/2$/);
});

test("arrow-key sheet paging: ArrowLeft advances to sheet 2, ArrowRight returns to sheet 1", async ({
  page,
}) => {
  await openCertifications(page);

  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\/certifications\/2$/);

  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/certifications$/);
});

test("CW-focus (sdd/distinction-section T5): landscape tile triggers show an inset focus ring on light, mid and dark tones", async ({
  page,
}) => {
  await openCertifications(page);
  await expect(page.locator(".cert-mat__trigger").first()).toBeVisible();

  // Real Tab navigation, not `locator.focus()` — a click (openModule ends on
  // one) suppresses `:focus-visible` in Chromium, but keyboard Tab always
  // sets it. Walk the tab ring until each tone's trigger has been checked.
  const tested: string[] = [];
  for (let i = 0; i < 60 && tested.length < 3; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || !el.classList.contains("cert-mat__trigger")) return null;
      const style = getComputedStyle(el);
      const host = el.closest(".cert-mat") as HTMLElement | null;
      return {
        tone: host?.className.match(/cert-mat--(light|mid|dark)/)?.[1] ?? "?",
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        outlineColor: style.outlineColor,
        hostFilter: host ? getComputedStyle(host).filter : "",
      };
    });
    if (!info || tested.includes(info.tone)) continue;
    tested.push(info.tone);

    expect(info.outlineStyle).not.toBe("none");
    expect(info.outlineWidth).toBe("2px");
    expect(parseFloat(info.outlineOffset)).toBeLessThan(0);
    // Ring colour per tone (D3): mid + dark override --focus to
    // --paper-white (rgb(246,246,244)); inheriting --oxblood on a dark
    // fill is 1.35:1 — the fail this override exists to prevent. light
    // keeps --oxblood #4a1f1a (12.93:1 on paper-white).
    const expectedColor =
      info.tone === "light" ? "rgb(74, 31, 26)" : "rgb(246, 246, 244)";
    expect(info.outlineColor).toBe(expectedColor);
    // `:focus-within` host filter: var(--cut-edge) resolves to four
    // drop-shadows + the hard rest shadow = five. The soft state shadow
    // was removed 2026-09-08 (sdd/distinction-section follow-up) — the
    // filter chain is now identical at rest and on focus.
    expect((info.hostFilter.match(/drop-shadow\(/g) ?? []).length).toBe(5);
  }

  expect(tested.sort()).toEqual(["dark", "light", "mid"]);
});

test("modal/pager interaction: ArrowRight with the scan modal open closes the modal, not the sheet", async ({
  page,
}) => {
  await openCertifications(page);
  // Land on sheet 2 first so `onBack` (ArrowRight -> previous sheet) is
  // actually wired -- this is the collision case: both CertScanModal's own
  // capture-phase ArrowRight-close listener AND useFieldKeyboard's
  // document-capture ArrowRight->onBack listener are live at once.
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\/certifications\/2$/);

  const anyTrigger = page.locator(".cert-mat__trigger").first();
  await anyTrigger.click();
  await expect(page.locator(".cert-scan-modal")).toBeVisible();

  await page.keyboard.press("ArrowRight");

  await expect(page.locator(".cert-scan-modal")).toHaveCount(0);
  // The sheet must NOT also have paged out from under the modal close.
  await expect(page).toHaveURL(/\/certifications\/2$/);
});
