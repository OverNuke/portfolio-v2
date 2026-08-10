import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PROJECTS } from "../../content/data";
import { assignSlots } from "./sheetLayout";
import { ProjectSheet } from "./ProjectSheet";

function renderSheet(projects = PROJECTS, extra: Partial<Parameters<typeof ProjectSheet>[0]> = {}) {
  return render(
    <ProjectSheet
      projects={projects}
      sheetIndex={1}
      sheetCount={1}
      totalRecords={projects.length}
      colophonName="Kevin S. F. García"
      colophonRole="Jr. Software Developer"
      {...extra}
    />,
  );
}

describe("ProjectSheet", () => {
  it("renders every record on the sheet exactly once", () => {
    renderSheet();
    for (const project of PROJECTS) {
      expect(screen.getAllByRole("heading", { name: project.title })).toHaveLength(1);
    }
  });

  it("selects the reference template for the current record count", () => {
    const { container } = renderSheet();
    expect(container.querySelector(".project-sheet")).toHaveAttribute("data-tpl", "2");
  });

  it("prints an image on the feature and the spread, and none on a record", () => {
    const { container } = renderSheet();

    expect(container.querySelectorAll(".sheet-panel--feature img")).toHaveLength(1);
    // The spread is the two-plate panel — that is the whole reason
    // AcopiaTech was moved into it.
    expect(container.querySelectorAll(".sheet-panel--spread img")).toHaveLength(2);
    // Records are type-only by design (Keff, 2026-08-05). A record growing
    // an image would quietly undo the sheet's rhythm.
    expect(container.querySelectorAll(".sheet-panel--record img")).toHaveLength(0);
  });

  it("gives every printed image a real alt string", () => {
    const { container } = renderSheet();
    const alts = [...container.querySelectorAll("img")].map((img) => img.getAttribute("alt"));

    expect(alts).toHaveLength(3);
    for (const alt of alts) expect(alt?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("hides every decorative mark from assistive tech", () => {
    const { container } = renderSheet();
    for (const selector of [".project-sheet__rail", ".sheet-panel__tick", ".sheet-panel__marks"]) {
      const nodes = [...container.querySelectorAll(selector)];
      expect(nodes.length).toBeGreaterThan(0);
      for (const node of nodes) expect(node).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("links a record out to its repo, and never ships a dead href", () => {
    const { container } = renderSheet();
    const links = [...container.querySelectorAll("a")];

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).not.toBe("#");
      expect(link.getAttribute("rel") ?? "").toContain("noopener");
    }
    // Odoo has no repo, so it gets no chip — the PRIVATE block says the
    // same thing the missing link would.
    const odoo = container.querySelector(".sheet-panel--record")!;
    expect(within(odoo as HTMLElement).queryByRole("link")).toBeNull();
  });

  it("hides the pager on a single-sheet archive", () => {
    const { container } = renderSheet();
    expect(container.querySelector(".project-sheet__pager")).toBeNull();
  });

  it("shows the pager and disables the direction that has nowhere to go", () => {
    const { container } = renderSheet(PROJECTS, {
      sheetCount: 3,
      sheetIndex: 1,
      onNext: () => {},
    });
    const buttons = [...container.querySelectorAll(".project-sheet__pager button")];

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toBeEnabled(); // next
    expect(buttons[1]).toBeDisabled(); // prev — nothing behind sheet 1
  });

  it("renders a real empty state instead of a blank grid", () => {
    const { container } = renderSheet([]);
    expect(screen.getByRole("heading", { name: /no records/i })).toBeInTheDocument();
    expect(container.querySelector(".project-sheet--empty")).toBeInTheDocument();
  });

  it("keeps DOM order at feature -> records -> spread -> colophon", () => {
    const { container } = renderSheet();
    const { feature, spread, records } = assignSlots(PROJECTS)!;
    const panels = [...container.querySelectorAll(".sheet-panel")];

    expect(panels[0]).toHaveClass("sheet-panel--feature");
    expect(panels[0]).toHaveTextContent(feature.title);
    expect(panels[1]).toHaveClass("sheet-panel--record");
    expect(panels[1]).toHaveTextContent(records[0].title);
    expect(panels[2]).toHaveClass("sheet-panel--spread");
    expect(panels[2]).toHaveTextContent(spread!.title);
    expect(panels[3]).toHaveClass("sheet-panel--colophon");
  });

  it("indexes record panels for the template ladder, since CSS cannot", () => {
    const { container } = renderSheet();
    const records = [...container.querySelectorAll(".sheet-panel--record")];
    records.forEach((panel, i) => expect(panel).toHaveAttribute("data-record", String(i + 1)));
  });
});
