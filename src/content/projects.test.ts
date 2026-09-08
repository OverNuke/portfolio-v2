import { describe, expect, it } from "vitest";
import { PROJECTS } from "./data";
import { resolveChipText } from "./projects";

/**
 * The disc annotation chip on /projects (sdd/projects-section-design-import).
 * Its text is `project.chip ?? getProjectCategory(project).toLowerCase()`:
 * an authored short label when one exists, otherwise the already-derived
 * category, lowercased to match the marker-hand voice.
 */
describe("resolveChipText", () => {
  it("uses the authored chip verbatim when the project has one", () => {
    const barbershop = PROJECTS.find((p) => p.title === "Barbershop")!;
    expect(barbershop.chip).toBe("flagship");
    expect(resolveChipText(barbershop)).toBe("flagship");
  });

  it("falls back to the derived category, lowercased, when no chip is authored", () => {
    const acopiatech = PROJECTS.find((p) => p.title === "AcopiaTech")!;
    expect(acopiatech.chip).toBeUndefined();
    expect(resolveChipText(acopiatech)).toBe("mobile");

    const odoo = PROJECTS.find((p) => p.title === "Odoo Custom Module")!;
    expect(odoo.chip).toBeUndefined();
    expect(resolveChipText(odoo)).toBe("module");
  });
});
