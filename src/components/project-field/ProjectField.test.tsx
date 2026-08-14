import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PROJECTS } from "../../content/data";
import { assignSlots, getFieldLayout, INDEX_TOP } from "./fieldLayout";
import { ProjectField } from "./ProjectField";

function renderField(projects = PROJECTS, extra: Partial<Parameters<typeof ProjectField>[0]> = {}) {
  return render(
    <ProjectField
      projects={projects}
      fieldIndex={1}
      fieldCount={1}
      totalRecords={projects.length}
      colophonName="Kevin S. F. García"
      colophonRole="Jr. Software Developer"
      {...extra}
    />,
  );
}

describe("ProjectField", () => {
  it("renders every record exactly once", () => {
    renderField();
    for (const project of PROJECTS) {
      expect(screen.getAllByRole("heading", { name: project.title })).toHaveLength(1);
    }
  });

  it("keys the geometry ladder off the field's own record count", () => {
    const { container } = renderField();
    expect(container.querySelector(".pf")).toHaveAttribute("data-layout", String(PROJECTS.length));
  });

  it("gives exactly one record the fused shape, and it is the marked feature", () => {
    const { container } = renderField();
    const fused = [...container.querySelectorAll(".pf-shape--fused")];
    expect(fused).toHaveLength(1);

    const primary = container.querySelector('.pf-record[data-primary="1"]')!;
    expect(primary).toContainElement(fused[0] as HTMLElement);
    expect(primary).toHaveTextContent(assignSlots(PROJECTS)!.primary.title);
  });

  it("prints one disc per record, and gives each one a real alt string", () => {
    const { container } = renderField();
    const images = [...container.querySelectorAll(".pf-shape img")];

    expect(images).toHaveLength(PROJECTS.length);
    for (const img of images) {
      expect((img.getAttribute("alt") ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("positions every record from the ladder, never from a literal in the component", () => {
    const { container } = renderField();
    const layout = getFieldLayout(PROJECTS.length);
    const slots = [layout.primary, ...layout.secondary];

    const figures = [...container.querySelectorAll(".pf-record__figure")] as HTMLElement[];
    const caps = [...container.querySelectorAll(".pf-record__cap")] as HTMLElement[];
    expect(figures).toHaveLength(slots.length);

    slots.forEach((slot, i) => {
      expect(figures[i].style.width).toBe(`${slot.shape.d}%`);
      expect(figures[i].style.top).toBe(`${slot.shape.cy}%`);
      expect(caps[i].style.left).toBe(`${slot.column.x}%`);
      expect(caps[i].style.width).toBe(`${slot.column.w}%`);
      // Every caption sits on the same baseline — the foot index is a
      // strip, not three independently placed blocks.
      expect(caps[i].style.top).toBe(`${INDEX_TOP}%`);
    });
  });

  it("orders the DOM by descending scale, so tab order needs no correction", () => {
    const { container } = renderField();
    const records = [...container.querySelectorAll(".pf-record")];
    const { primary, secondary } = assignSlots(PROJECTS)!;

    expect(records).toHaveLength(PROJECTS.length);
    expect(records[0]).toHaveTextContent(primary.title);
    secondary.forEach((project, i) => {
      expect(records[i + 1]).toHaveTextContent(project.title);
    });
  });

  it("hides every decorative mark from assistive tech", () => {
    const { container } = renderField();
    // The last four arrived with the poster tier (2026-08-14): three empty
    // boxes that draw the stacked composition, and the brand-mark row.
    for (const selector of [
      ".pf__mark",
      ".pf__note",
      ".pf-record__lead",
      ".pf-record__bar",
      ".pf-record__corner",
      ".pf-record__disc",
      ".pf-record__badges",
    ]) {
      const nodes = [...container.querySelectorAll(selector)];
      expect(nodes.length, selector).toBeGreaterThan(0);
      for (const node of nodes) expect(node).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("links a record out to its repo, and never ships a dead href", () => {
    const { container } = renderField();
    const links = [...container.querySelectorAll("a")];

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).not.toBe("#");
      expect(link.getAttribute("rel") ?? "").toContain("noopener");
    }
  });

  it("gives the repo-less record an expand button instead of a dead link, and the others neither", () => {
    const { container } = renderField();
    const records = [...container.querySelectorAll(".pf-record")] as HTMLElement[];

    for (const record of records) {
      const project = PROJECTS.find((p) => record.textContent?.includes(p.title))!;
      const hasRepo = Boolean(project.repo);

      // Exactly one action per record, never both.
      expect(within(record).queryAllByRole("link")).toHaveLength(hasRepo ? 1 : 0);
      expect(within(record).queryAllByRole("button")).toHaveLength(hasRepo ? 0 : 1);
    }
  });

  it("carries a real, readable <h2> for the composition", () => {
    renderField();
    // Distinct from PageLayer's own <h1> ("PROJECT DATABASE"), which stays
    // the page's sole title. No aria-hidden fragments and no
    // visually-hidden twin: the title is one word, so the plainest markup
    // is also the accessible one.
    expect(screen.getByRole("heading", { level: 2, name: "Projects" })).toBeInTheDocument();
  });

  it("inerts every record while the image-expand overlay is open", () => {
    const { container } = renderField();
    const trigger = screen.getByRole("button", { name: /expand/i });
    const records = container.querySelector(".pf__records")!;

    expect(records).not.toHaveAttribute("inert");

    fireEvent.click(trigger);

    expect(records).toHaveAttribute("inert");
    expect(screen.getByRole("dialog", { name: /odoo/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(records).not.toHaveAttribute("inert");
  });

  it("returns focus to the trigger when the overlay closes", async () => {
    // Deferred by a microtask in `ImageExpandOverlay` so it lands after
    // `useInert` has cleared `inert` — see that file's comment. jsdom does
    // not implement inert, so this test cannot prove the browser
    // behaviour; it exists to stop the deferral being "simplified" away.
    renderField();
    const trigger = screen.getByRole("button", { name: /expand/i });
    trigger.focus();

    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: /close/i })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("alternates which side each record composes on", () => {
    // The poster tier mirrors even records. Asserted on the attribute
    // rather than on CSS, because the attribute is the contract: it is
    // written from the record's position so the alternation survives
    // reordering, which `:nth-child(even)` would not.
    const { container } = renderField();
    const sides = [...container.querySelectorAll(".pf-record")].map(
      (r) => (r as HTMLElement).dataset.side,
    );
    expect(sides).toEqual(["left", "right", "left"]);
  });

  it("draws a mark per tag without announcing the stack twice", () => {
    const { container } = renderField();
    const first = container.querySelector(".pf-record")!;
    const project = assignSlots(PROJECTS)!.primary;

    // One badge per tag, marks included — and the row is decorative, so
    // the words in `.pf-record__stack` stay the single accessible copy.
    // If the badges ever stop being aria-hidden this fails, which is the
    // point: two copies of the same list is worse than none.
    expect(first.querySelectorAll(".pf-record__badge")).toHaveLength(project.tags.length);
    expect(first.querySelector(".pf-record__badges")).toHaveAttribute("aria-hidden", "true");
    expect(first.querySelector(".pf-record__stack")).not.toHaveAttribute("aria-hidden");
    expect(first.querySelector(".pf-record__stack")).toHaveTextContent(project.tags[0]);
  });

  it("splits a four-digit year for the stamp and leaves anything else whole", () => {
    // `Project.year` is free-form. Halving "2023—2024" would print
    // "2023—" over "2024" — a stamp-shaped bug — so the split is guarded
    // and `data-split` records which branch ran.
    const { container } = renderField();
    const year = container.querySelector(".pf-record__year")!;
    expect(year).toHaveAttribute("data-split", "1");
    expect([...year.querySelectorAll(".pf-record__yr")].map((n) => n.textContent)).toEqual([
      "20",
      "25",
    ]);

    const ranged = renderField(PROJECTS.map((p) => ({ ...p, year: "2023—2024" })));
    const whole = ranged.container.querySelector(".pf-record__year")!;
    expect(whole).toHaveAttribute("data-split", "0");
    expect(whole).toHaveTextContent("2023—2024");
  });

  it("hides the pager on a single-field archive", () => {
    const { container } = renderField();
    expect(container.querySelector(".pf__pager")).toBeNull();
  });

  it("shows the pager and disables the direction that has nowhere to go", () => {
    const { container } = renderField(PROJECTS, {
      fieldCount: 3,
      fieldIndex: 1,
      onNext: () => {},
    });
    const buttons = [...container.querySelectorAll(".pf__pager button")];

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toBeEnabled(); // next
    expect(buttons[1]).toBeDisabled(); // prev — nothing behind field 1
  });

  it("renders a real empty state instead of a blank band", () => {
    const { container } = renderField([]);
    expect(screen.getByRole("heading", { name: /no records/i })).toBeInTheDocument();
    expect(container.querySelector(".pf--empty")).toBeInTheDocument();
    expect(container.querySelector(".pf-record")).toBeNull();
  });

  it("defines the fused clip path exactly once, however many records there are", () => {
    // `url(#pf-fused)` must resolve within the same document, and a
    // duplicated id resolves to whichever came first — harmless until the
    // first one unmounts.
    const { container } = renderField();
    expect(container.querySelectorAll("#pf-fused")).toHaveLength(1);
  });
});
