import { describe, expect, it } from "vitest";
import type { Project } from "../../content/types";
import { PROJECTS } from "../../content/data";
import { assignSlots, clampSheet, paginate, RECORDS_PER_SHEET } from "./sheetLayout";

function make(title: string, slot?: Project["sheetSlot"]): Project {
  return {
    title,
    subtitle: "sub",
    description: "desc",
    tags: ["Tag"],
    year: "2025",
    href: "#",
    image: "img.png",
    imageAlt: "alt",
    ...(slot ? { sheetSlot: slot } : {}),
  };
}

describe("assignSlots", () => {
  it("returns null for an empty sheet so the caller can render the empty state", () => {
    expect(assignSlots([])).toBeNull();
  });

  it("honours explicit sheetSlot over array position", () => {
    const a = make("A");
    const b = make("B", "spread");
    const c = make("C", "feature");
    const slots = assignSlots([a, b, c])!;

    expect(slots.feature).toBe(c);
    expect(slots.spread).toBe(b);
    expect(slots.records).toEqual([a]);
  });

  it("falls back to first-as-feature and last-as-spread when nothing is marked", () => {
    const [a, b, c] = [make("A"), make("B"), make("C")];
    const slots = assignSlots([a, b, c])!;

    expect(slots.feature).toBe(a);
    expect(slots.spread).toBe(c);
    expect(slots.records).toEqual([b]);
  });

  it("gives a single record the feature slot and no spread", () => {
    const only = make("Only");
    const slots = assignSlots([only])!;

    expect(slots.feature).toBe(only);
    expect(slots.spread).toBeUndefined();
    expect(slots.records).toEqual([]);
  });

  it("never places the same record in two slots", () => {
    for (let n = 1; n <= RECORDS_PER_SHEET; n++) {
      const input = Array.from({ length: n }, (_, i) => make(`P${i}`));
      const { feature, spread, records } = assignSlots(input)!;
      const all = [feature, ...(spread ? [spread] : []), ...records];

      expect(all).toHaveLength(n);
      expect(new Set(all).size).toBe(n);
    }
  });

  it("assigns the real PROJECTS the slots Keff chose on 2026-08-05", () => {
    const { feature, spread, records } = assignSlots(PROJECTS)!;

    expect(feature.title).toBe("Barbershop");
    // AcopiaTech carries the images; Odoo is the type-only record.
    expect(spread?.title).toBe("AcopiaTech");
    expect(records.map((r) => r.title)).toEqual(["Odoo Custom Module"]);
  });

  it("gives the spread slot a second plate, since the panel prints two", () => {
    const { spread } = assignSlots(PROJECTS)!;
    expect(spread?.imageB).toBeTruthy();
    expect(spread?.imageBAlt?.length).toBeGreaterThan(0);
  });
});

describe("paginate", () => {
  it("keeps every record on one sheet up to the cap", () => {
    const input = Array.from({ length: RECORDS_PER_SHEET }, (_, i) => make(`P${i}`));
    expect(paginate(input)).toHaveLength(1);
  });

  it("turns the page at one past the cap", () => {
    const input = Array.from({ length: RECORDS_PER_SHEET + 1 }, (_, i) => make(`P${i}`));
    const sheets = paginate(input);

    expect(sheets).toHaveLength(2);
    expect(sheets[0]).toHaveLength(RECORDS_PER_SHEET);
    expect(sheets[1]).toHaveLength(1);
  });

  it("loses no record and preserves order", () => {
    const input = Array.from({ length: 13 }, (_, i) => make(`P${i}`));
    expect(paginate(input).flat()).toEqual(input);
  });

  it("returns one empty sheet rather than no sheets, so a page always renders", () => {
    expect(paginate([])).toEqual([[]]);
  });

  it("rejects a nonsense page size instead of looping forever", () => {
    expect(() => paginate([make("A")], 0)).toThrow(RangeError);
  });

  it("fits the current PROJECTS on a single sheet", () => {
    expect(paginate(PROJECTS)).toHaveLength(1);
  });
});

describe("clampSheet", () => {
  it.each([
    ["2", 3, 2],
    [null, 3, 1],
    ["0", 3, 1],
    ["-4", 3, 1],
    ["99", 3, 3],
    ["banana", 3, 1],
    ["", 3, 1],
  ])("?sheet=%s of %i sheets resolves to %i", (raw, count, expected) => {
    expect(clampSheet(raw, count)).toBe(expected);
  });

  it("never returns 0, even when there are no sheets to speak of", () => {
    expect(clampSheet("1", 0)).toBe(1);
  });
});
