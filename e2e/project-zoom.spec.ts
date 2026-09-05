import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoHome, openModule } from "./helpers";

/**
 * Task 2.11 (sdd/design-import-sections), spec domain "project-node-zoom"
 * (PZ1-PZ6). Covers the browser-only claims vitest/jsdom cannot: real
 * `inert` reachability, real focus timing (deferred past the caption's
 * `visibility: hidden` window), and real capture-phase keydown precedence
 * over the shell's own page-turn handler.
 *
 * Odoo-first throughout (per the design's own sequencing note): it is the
 * only one of the three records whose sole affordance is the zoom — no
 * `repo`, so if the zoom path regressed, Odoo would have no interaction at
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

test("PZ1/PZ2/PZ5: expanding Odoo zooms it toward centre and inerts the siblings", async ({ page }) => {
  await openProjects(page);

  const odoo = recordFor(page, "Odoo Custom Module");
  const barbershop = recordFor(page, "Barbershop");
  const acopiaTech = recordFor(page, "AcopiaTech");

  await expect(odoo).not.toHaveAttribute("inert", "");
  await odoo.getByRole("button", { name: /expand/i }).click();

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

  await odoo.getByRole("button", { name: /expand/i }).click();
  await expect(odoo).toHaveAttribute("data-zoom", "self");

  await page.keyboard.press("Escape");
  await expect(odoo).toHaveAttribute("data-zoom", "none");
  // The shell's own Escape/close handler did NOT also fire — the page is
  // still open, still on /projects.
  await expect(page.locator(".page-layer")).toBeVisible();

  await odoo.getByRole("button", { name: /expand/i }).click();
  await expect(odoo).toHaveAttribute("data-zoom", "self");

  await page.keyboard.press("ArrowRight");
  await expect(odoo).toHaveAttribute("data-zoom", "none");
  await expect(page.locator(".page-layer")).toBeVisible();
});

test("PZ4: focus returns to the trigger on close, read from document.activeElement", async ({ page }) => {
  await openProjects(page);
  const odoo = recordFor(page, "Odoo Custom Module");
  const trigger = odoo.getByRole("button", { name: /expand/i });

  await trigger.focus();
  await trigger.press("Enter");
  await expect(odoo.locator(".pf-zoom__close")).toBeFocused();

  await page.keyboard.press("Escape");

  // Deferred by a microtask past the caption's visibility window — jsdom
  // cannot prove this at all (no `inert`, no real focus semantics).
  await expect(trigger).toBeFocused();
  const focusedIsExpand = await page.evaluate(
    () => document.activeElement?.textContent?.includes("Expand") ?? false,
  );
  expect(focusedIsExpand).toBe(true);
});

test("PZ6: Odoo still has a working expand path (no repo — the zoom is its only affordance)", async ({
  page,
}) => {
  await openProjects(page);
  const odoo = recordFor(page, "Odoo Custom Module");

  await expect(odoo.getByRole("link")).toHaveCount(0);
  await odoo.getByRole("button", { name: /expand/i }).click();
  await expect(page.getByRole("dialog", { name: /odoo/i })).toBeVisible();
});

test("PF4: a repo-holding record shows both the Repository link and the Expand control", async ({
  page,
}) => {
  await openProjects(page);
  const barbershop = recordFor(page, "Barbershop");

  await expect(barbershop.getByRole("link")).toHaveCount(1);
  await expect(barbershop.getByRole("button", { name: /expand/i })).toHaveCount(1);
});

test.describe("no expand control below the 900px zoom tier", () => {
  test.use({ viewport: { width: 480, height: 900 } });

  test("the poster tier renders no expand chip at all", async ({ page }) => {
    await openProjects(page);
    await expect(page.getByRole("button", { name: /expand/i })).toHaveCount(0);
  });
});
