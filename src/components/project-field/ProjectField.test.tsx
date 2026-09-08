import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PROJECTS } from "../../content/data";
import { assignSlots, chipAnchor, getFieldLayout, INDEX_TOP } from "./fieldLayout";
import { ProjectField } from "./ProjectField";

function renderField(projects = PROJECTS, extra: Partial<Parameters<typeof ProjectField>[0]> = {}) {
  return render(
    <ProjectField
      projects={projects}
      fieldIndex={1}
      fieldCount={1}
      totalRecords={projects.length}
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

  it("gives every record the plain circle shape, primary included", () => {
    // P1: the fused lobe is gone. The primary is marked by `data-primary`
    // and the caption hierarchy, not by a distinct shape — every disc on
    // the field is `circle(closest-side)`.
    const { container } = renderField();
    const circles = [...container.querySelectorAll(".pf-shape--circle")];
    expect(circles).toHaveLength(PROJECTS.length);
    expect(container.querySelectorAll(".pf-shape--fused")).toHaveLength(0);

    const primary = container.querySelector('.pf-record[data-primary="1"]')!;
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
    // `.pf__chrome` replaced `.pf__note` (2026-09-07); `.pf-record__chip`
    // and `.pf__tone` are the new decorative annotation layer.
    for (const selector of [
      ".pf__mark",
      ".pf__chrome",
      ".pf-record__lead",
      ".pf-record__bar",
      ".pf-record__corner",
      ".pf-record__disc",
      ".pf-record__badges",
      ".pf-record__chip",
      ".pf__tone",
    ]) {
      const nodes = [...container.querySelectorAll(selector)];
      expect(nodes.length, selector).toBeGreaterThan(0);
      for (const node of nodes) expect(node).toHaveAttribute("aria-hidden", "true");
    }

    // `.pf__note` (the retired bottom-left colophon) and its strings are
    // gone — not just hidden. Same guard idiom as `.pf-shape--fused`.
    expect(container.querySelector(".pf__note")).toBeNull();
    expect(container.textContent).not.toMatch(/click .*expand|esc to close/i);

    // The only chrome caption at the desktop tier is "panel 4b".
    const chrome = [...container.querySelectorAll(".pf__chrome")];
    expect(chrome).toHaveLength(1);
    expect(chrome[0]).toHaveTextContent(/^\s*panel 4b\s*$/);
  });

  it("builds the desktop foot column as prose + marker, with subtitle only as the marker fallback", () => {
    // D3: the `subtitle` string appears TWICE in the desktop DOM — once in
    // `.pf-record__sub` (CSS `display: none` at this tier, so out of the
    // a11y tree) and once as the `.pf-record__marker` fallback. jsdom
    // applies no styles here (CSS import is stubbed), so this asserts
    // STRUCTURE, not visibility: exactly one of each node per record,
    // carrying the right string.
    const { container } = renderField();
    const records = [...container.querySelectorAll(".pf-record")];
    expect(records).toHaveLength(PROJECTS.length);

    for (const record of records) {
      const project = PROJECTS.find((p) => record.textContent?.includes(p.title))!;

      const subs = [...record.querySelectorAll(".pf-record__sub")];
      const prose = [...record.querySelectorAll(".pf-record__prose")];
      const markers = [...record.querySelectorAll(".pf-record__marker")];

      expect(subs, "one __sub").toHaveLength(1);
      expect(prose, "one __prose").toHaveLength(1);
      expect(markers, "one __marker").toHaveLength(1);

      expect(subs[0]).toHaveTextContent(project.subtitle);
      expect(prose[0]).toHaveTextContent(project.description);
      // No `marker` authored on any live record → falls back to subtitle.
      expect(markers[0]).toHaveTextContent(project.marker ?? project.subtitle);

      // The marker line is the only desktop render of authored annotation
      // copy, so it MUST stay in the accessibility tree.
      expect(markers[0]).not.toHaveAttribute("aria-hidden");
    }
  });

  it("hangs each disc chip as a sibling of the figure, anchored in stage percentages", () => {
    const { container } = renderField();
    const layout = getFieldLayout(PROJECTS.length);
    const slots = [layout.primary, ...layout.secondary];

    const records = [...container.querySelectorAll(".pf-record")];
    records.forEach((record, i) => {
      const chip = record.querySelector(".pf-record__chip") as HTMLElement;
      const figure = record.querySelector(".pf-record__figure")!;
      expect(chip).toBeTruthy();
      // Sibling, not descendant — a child would inherit the figure's
      // drop-shadow edge and be scaled by the zoom transform.
      expect(chip.parentElement).toBe(figure.parentElement);
      expect(figure.contains(chip)).toBe(false);

      const anchor = chipAnchor(slots[i].shape, slots[i].chipSide ?? "L");
      expect(chip.style.top).toBe(`${anchor.top}%`);
      if (anchor.left !== undefined) {
        expect(chip.style.left).toBe(`${anchor.left}%`);
      } else {
        expect(chip.style.right).toBe(`${anchor.right}%`);
      }
    });
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

  it("gives every record a real expand control, and repo records get both actions (PF3, PF4)", () => {
    // P2 overturns RecordAction's old "never both" rule, and fixes the
    // latent bug where the primary (Barbershop) had no `onExpand` at all.
    const { container } = renderField();
    const records = [...container.querySelectorAll(".pf-record")] as HTMLElement[];
    expect(records.length).toBeGreaterThan(0);

    for (const record of records) {
      const project = PROJECTS.find((p) => record.textContent?.includes(p.title))!;
      const hasRepo = Boolean(project.repo);

      expect(within(record).queryAllByRole("link")).toHaveLength(hasRepo ? 1 : 0);
      // Every record — including the primary — gets a real, focusable
      // expand control, independent of whether a repo chip is also present.
      const expandButtons = within(record).getAllByRole("button", { name: /expand/i });
      expect(expandButtons).toHaveLength(1);
    }
  });

  it("keeps the repo chip and the expand control independently focusable when both are present", () => {
    // PF4: neither disables nor shadows the other.
    const { container } = renderField();
    const barbershop = [...container.querySelectorAll(".pf-record")].find((r) =>
      r.textContent?.includes("Barbershop"),
    ) as HTMLElement;
    expect(barbershop).toBeTruthy();

    const link = within(barbershop).getByRole("link");
    const button = within(barbershop).getByRole("button", { name: /expand/i });

    link.focus();
    expect(link).toHaveFocus();
    button.focus();
    expect(button).toHaveFocus();
  });

  it("carries a real, readable <h2> for the composition", () => {
    renderField();
    // Distinct from PageLayer's own <h1> ("PROJECT DATABASE"), which stays
    // the page's sole title. No aria-hidden fragments and no
    // visually-hidden twin: the title is one word, so the plainest markup
    // is also the accessible one.
    expect(screen.getByRole("heading", { level: 2, name: "Projects" })).toBeInTheDocument();
  });

  it("inerts every OTHER record while one is zoomed, and never the expanded one itself (PZ2)", () => {
    // Odoo is the risk case — the only record whose sole affordance was
    // the old overlay — so it is the one to build the zoom against first.
    const { container } = renderField();
    const records = [...container.querySelectorAll(".pf-record")] as HTMLElement[];
    for (const record of records) expect(record).not.toHaveAttribute("inert");

    const odoo = records.find((r) => r.textContent?.includes("Odoo"))!;
    const trigger = within(odoo).getByRole("button", { name: /expand/i });

    fireEvent.click(trigger);

    expect(odoo).not.toHaveAttribute("inert");
    expect(odoo).toHaveAttribute("data-zoom", "self");
    for (const record of records) {
      if (record === odoo) continue;
      expect(record).toHaveAttribute("inert");
      expect(record).toHaveAttribute("data-zoom", "other");
    }

    // Labelled by the record's own title (PZ5) — no duplicate <img>, no
    // separate overlay dialog.
    expect(screen.getByRole("dialog", { name: /odoo/i })).toBe(odoo);

    fireEvent.click(within(odoo).getByRole("button", { name: /close/i }));

    for (const record of records) {
      expect(record).not.toHaveAttribute("inert");
      expect(record).toHaveAttribute("data-zoom", "none");
    }
  });

  it("closes on Escape and on ArrowRight, capture-phase (PZ3)", () => {
    const { container } = renderField();
    const odoo = [...container.querySelectorAll(".pf-record")].find((r) =>
      r.textContent?.includes("Odoo"),
    ) as HTMLElement;

    fireEvent.click(within(odoo).getByRole("button", { name: /expand/i }));
    expect(odoo).toHaveAttribute("data-zoom", "self");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(odoo).toHaveAttribute("data-zoom", "none");

    fireEvent.click(within(odoo).getByRole("button", { name: /expand/i }));
    expect(odoo).toHaveAttribute("data-zoom", "self");

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(odoo).toHaveAttribute("data-zoom", "none");
  });

  it("returns focus to the trigger when the zoom closes (PZ4)", async () => {
    // Deferred by a microtask so it lands after the caption (and the
    // trigger inside it) is visible again — see ProjectField.tsx's comment.
    // jsdom does not implement inert or visibility-driven focusability, so
    // this cannot prove the browser behaviour; it exists to stop the
    // deferral being "simplified" away.
    const { container } = renderField();
    const odoo = [...container.querySelectorAll(".pf-record")].find((r) =>
      r.textContent?.includes("Odoo"),
    ) as HTMLElement;
    const trigger = within(odoo).getByRole("button", { name: /expand/i });
    trigger.focus();

    fireEvent.click(trigger);
    expect(within(odoo).getByRole("button", { name: /close/i })).toHaveFocus();

    fireEvent.click(within(odoo).getByRole("button", { name: /close/i }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("still gives Odoo a working expand path with ImageExpandOverlay removed (PZ6)", () => {
    // Odoo carries no `repo`, so the zoom is its only affordance — this is
    // the regression the old overlay's removal must not reintroduce.
    const { container } = renderField();
    const odoo = [...container.querySelectorAll(".pf-record")].find((r) =>
      r.textContent?.includes("Odoo"),
    ) as HTMLElement;
    expect(within(odoo).queryAllByRole("link")).toHaveLength(0);

    const trigger = within(odoo).getByRole("button", { name: /expand/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: /odoo/i })).toBe(odoo);
  });

  it("does not render an expand control at all below the 900px zoom tier", () => {
    // Not CSS-hidden — not rendered. `cx`/`cy`/`d` are void in the poster
    // tier, and an affordance that computes a wrong transform is worse
    // than an absent one.
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query.includes("900"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    const { container } = renderField();
    expect(within(container).queryAllByRole("button", { name: /expand/i })).toHaveLength(0);

    vi.unstubAllGlobals();
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

});
