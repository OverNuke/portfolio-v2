import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("keys the scatter ladder off the sheet's own record count", () => {
    const { container } = renderSheet();
    expect(container.querySelector(".project-sheet")).toHaveAttribute(
      "data-layout",
      String(PROJECTS.length),
    );
  });

  it("prints one disc image on every panel kind, since the 2026-08-13 circular redesign", () => {
    const { container } = renderSheet();

    expect(container.querySelectorAll(".sheet-panel--feature img")).toHaveLength(1);
    // AcopiaTech's second plate (`imageB`) is intentionally NOT rendered —
    // a 3-shape composition (fused/medium/small) has no fourth shape to
    // host it. See SpreadPanel's doc comment.
    expect(container.querySelectorAll(".sheet-panel--spread img")).toHaveLength(1);
    // Records gained an image with the circular redesign — the smallest
    // disc in the composition's scale hierarchy needs one now.
    expect(container.querySelectorAll(".sheet-panel--record img")).toHaveLength(1);
  });

  it("gives every printed image a real alt string", () => {
    const { container } = renderSheet();
    const alts = [...container.querySelectorAll("img")].map((img) => img.getAttribute("alt"));

    // Coincidentally still 3 (1 feature + 1 spread + 1 record) — a
    // different set of images than before the redesign, same count.
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
  });

  it("gives the repo-less record an expand button instead of a dead link, and the others neither", () => {
    const { container } = renderSheet();

    // Odoo has no repo but does have an image — it gets the expand
    // trigger, not a chip (the PRIVATE block already says "no repo").
    const odoo = container.querySelector(".sheet-panel--record")!;
    expect(within(odoo as HTMLElement).queryByRole("link")).toBeNull();
    expect(within(odoo as HTMLElement).getByRole("button", { name: /expand/i })).toBeInTheDocument();

    // Barbershop and AcopiaTech have real repos — they keep the Source
    // chip and never grow an expand button too. A card gets one action.
    for (const selector of [".sheet-panel--feature", ".sheet-panel--spread"]) {
      const panel = container.querySelector(selector)!;
      expect(within(panel as HTMLElement).getByRole("link", { name: /source/i })).toBeInTheDocument();
      expect(within(panel as HTMLElement).queryByRole("button", { name: /expand/i })).toBeNull();
    }
  });

  it("carries a real <h2> composition title with a computed accessible name, not the raw fragment text", () => {
    renderSheet();
    // The accessible-name algorithm skips `aria-hidden` content, so this
    // only passes if the visually-hidden full string — not the "PRO" /
    // "JECTS" decorative fragments sitting beside it — is what a screen
    // reader actually announces. Distinct from PageLayer's own <h1>
    // ("PROJECT DATABASE"), which stays the page's sole title.
    expect(screen.getByRole("heading", { level: 2, name: "Projects" })).toBeInTheDocument();
  });

  it("inerts every panel while the image-expand overlay is open", () => {
    const { container } = renderSheet();
    const trigger = within(container.querySelector(".sheet-panel--record") as HTMLElement).getByRole(
      "button",
      { name: /expand/i },
    );

    const panels = container.querySelector(".project-sheet__panels")!;
    expect(panels).not.toHaveAttribute("inert");

    fireEvent.click(trigger);

    expect(panels).toHaveAttribute("inert");
    expect(screen.getByRole("dialog", { name: /odoo/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(panels).not.toHaveAttribute("inert");
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
