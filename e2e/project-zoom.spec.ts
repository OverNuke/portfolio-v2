import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoHome, openModule } from "./helpers";

/**
 * Spec domain "project-node-zoom" (PZ1-PZ6). Covers the browser-only claims
 * vitest/jsdom cannot: real `inert` reachability, real focus timing
 * (deferred past the commit), and real capture-phase keydown precedence over
 * the shell's own page-turn handler.
 *
 * NARROWED 2026-09-08: the zoom trigger is the disc plate itself (a
 * `button.pf-shape` naming "… — view larger"), not a foot-index "Expand"
 * chip. Odoo-first throughout (per the design's own sequencing note): it is
 * the only one of the three records whose sole affordance is the zoom — no
 * `repo` — so if the zoom path regressed, Odoo would have no interaction at
 * all and nothing else would surface it.
 */

async function openProjects(page: Page): Promise<void> {
  await gotoHome(page);
  await openModule(page, "projects");
  await expect(page.locator(".page-layer")).toBeVisible();
}

function recordFor(page: Page, title: string): Locator {
  return page.locator(".pf-record", { hasText: title });
}

function plateFor(page: Page, title: string): Locator {
  return recordFor(page, title).getByRole("button", { name: /view larger/i });
}

test("PZ1/PZ2/PZ5: expanding Odoo zooms it toward centre and inerts the siblings", async ({ page }) => {
  await openProjects(page);

  const odoo = recordFor(page, "Odoo Custom Module");
  const barbershop = recordFor(page, "Barbershop");
  const acopiaTech = recordFor(page, "AcopiaTech");

  await expect(odoo).not.toHaveAttribute("inert", "");
  await plateFor(page, "Odoo Custom Module").click();

  await expect(odoo).toHaveAttribute("data-zoom", "self");
  await expect(odoo).not.toHaveAttribute("inert", "");
  await expect(odoo).toHaveAttribute("role", "dialog");

  await expect(barbershop).toHaveAttribute("inert", "");
  await expect(acopiaTech).toHaveAttribute("inert", "");

  // PZ5 — the dialog's accessible name resolves through the (visually
  // hidden while zoomed) caption to the record's own title, not a
  // duplicate <img> or a second heading.
  await expect(page.getByRole("dialog", { name: /odoo/i })).toHaveCount(1);
});

test("PZ3: Escape and ArrowRight both close it, capture-phase, and the shell page does not also close", async ({
  page,
}) => {
  await openProjects(page);
  const odoo = recordFor(page, "Odoo Custom Module");

  await plateFor(page, "Odoo Custom Module").click();
  await expect(odoo).toHaveAttribute("data-zoom", "self");

  await page.keyboard.press("Escape");
  await expect(odoo).toHaveAttribute("data-zoom", "none");
  // The shell's own Escape/close handler did NOT also fire — the page is
  // still open, still on /projects.
  await expect(page.locator(".page-layer")).toBeVisible();

  await plateFor(page, "Odoo Custom Module").click();
  await expect(odoo).toHaveAttribute("data-zoom", "self");

  await page.keyboard.press("ArrowRight");
  await expect(odoo).toHaveAttribute("data-zoom", "none");
  await expect(page.locator(".page-layer")).toBeVisible();
});

test("PZ4: focus returns to the plate on close, read from document.activeElement", async ({ page }) => {
  await openProjects(page);
  const odoo = recordFor(page, "Odoo Custom Module");
  const plate = plateFor(page, "Odoo Custom Module");

  await plate.focus();
  await plate.press("Enter");
  await expect(odoo.locator(".pf-zoom__close")).toBeFocused();

  await page.keyboard.press("Escape");

  // Deferred past the commit — jsdom cannot prove this at all (no `inert`,
  // no real focus semantics, no zoom transform).
  await expect(plate).toBeFocused();
  const focusedIsPlate = await page.evaluate(
    () =>
      (document.activeElement?.classList.contains("pf-shape") ?? false) &&
      (document.activeElement?.textContent?.includes("view larger") ?? false),
  );
  expect(focusedIsPlate).toBe(true);
});

test("PZ6: Odoo still has a working zoom path (no repo — the plate is its only affordance)", async ({
  page,
}) => {
  await openProjects(page);
  const odoo = recordFor(page, "Odoo Custom Module");

  await expect(odoo.getByRole("link")).toHaveCount(0);
  await plateFor(page, "Odoo Custom Module").click();
  await expect(page.getByRole("dialog", { name: /odoo/i })).toBeVisible();
});

test("PF4: a repo-holding record shows the Repository link AND the plate is the zoom trigger", async ({
  page,
}) => {
  await openProjects(page);
  const barbershop = recordFor(page, "Barbershop");

  await expect(barbershop.getByRole("link")).toHaveCount(1);
  await expect(barbershop.getByRole("button", { name: /view larger/i })).toHaveCount(1);
  // The plate is in the figure, not the caption action row.
  await expect(barbershop.locator(".pf-record__figure button.pf-shape")).toHaveCount(1);
});

test("the disc reacts to hover (shadow always, lift when motion is allowed)", async ({ page }) => {
  await openProjects(page);
  const record = recordFor(page, "Odoo Custom Module");
  const figure = record.locator(".pf-record__figure");

  const restFilter = await figure.evaluate((el) => getComputedStyle(el).transform + "|" + getComputedStyle(el).filter);
  await plateFor(page, "Odoo Custom Module").hover();

  // The shadow-deepen fires unconditionally; the 3px lift is additionally
  // gated on [data-motion="full"]. Either way the computed style changes.
  await expect
    .poll(() =>
      figure.evaluate((el) => getComputedStyle(el).transform + "|" + getComputedStyle(el).filter),
    )
    .not.toBe(restFilter);
});

test.describe("no plate trigger below the 900px zoom tier", () => {
  test.use({ viewport: { width: 480, height: 900 } });

  test("the poster tier renders the plate as a plain disc, not a button", async ({ page }) => {
    await openProjects(page);
    await expect(page.getByRole("button", { name: /view larger/i })).toHaveCount(0);
    await expect(page.locator("button.pf-shape")).toHaveCount(0);
    await expect(page.locator(".pf-shape__ring")).toHaveCount(0);
  });
});
