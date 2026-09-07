import { describe, expect, it } from "vitest";
import { cardCenter, dockFactor, dockFactors, dockValues, type DockCard } from "./dockHover";

// Mockup canvas is 1440x900; `spread` in the mockup is 240px, anisotropy 2.2
// (design D3). These are the values the worked example in the design doc uses.
const SPREAD = 240;
const ANISO = 2.2;

// Plate centres read off the design's D1 coordinate table (mockup px):
//   Email    a-primary  96,250  214x340 -> (203, 420)
//   GitHub   a-rail-a  344,120  162x520 -> (425, 380)
//   WhatsApp a-aside   534,312  214x336 -> (641, 480)
//   LinkedIn a-feature 790,470  334x344 -> (957, 642)
const PLATES: DockCard<string>[] = [
  { key: "email", centerX: 203, centerY: 420 },
  { key: "github", centerX: 425, centerY: 380 },
  { key: "whatsapp", centerX: 641, centerY: 480 },
  { key: "linkedin", centerX: 957, centerY: 642 },
];

describe("dockFactor", () => {
  it("is exactly 1 when the pointer sits on the card centre", () => {
    expect(dockFactor(0, 0, SPREAD, ANISO)).toBe(1);
  });

  it("decreases monotonically as horizontal distance grows", () => {
    const samples = [0, 40, 80, 120, 160, 200, 240, 400].map((dx) =>
      dockFactor(dx, 0, SPREAD, ANISO),
    );
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeLessThan(samples[i - 1]);
    }
  });

  it("decays strictly slower vertically than horizontally at equal offset (anisotropy)", () => {
    for (const d of [30, 90, 180, 300]) {
      expect(dockFactor(0, d, SPREAD, ANISO)).toBeGreaterThan(dockFactor(d, 0, SPREAD, ANISO));
    }
  });

  it("stays within [0, 1] and finite for every input, including a degenerate spread of 0", () => {
    const cases: Array<[number, number, number]> = [
      [0, 0, SPREAD],
      [-500, 300, SPREAD],
      [1e4, -1e4, SPREAD],
      [0, 0, 0],
      [50, 50, 0],
    ];
    for (const [dx, dy, spread] of cases) {
      const f = dockFactor(dx, dy, spread, ANISO);
      expect(Number.isFinite(f)).toBe(true);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });
});

describe("dockFactors", () => {
  it("returns 0 for every card when the pointer has left the stage (null)", () => {
    const f = dockFactors(null, PLATES, SPREAD, ANISO);
    expect([...f.values()]).toEqual([0, 0, 0, 0]);
  });

  it("is single-lobed: the plate under the pointer strictly outranks every other plate", () => {
    for (const target of PLATES) {
      const f = dockFactors({ x: target.centerX, y: target.centerY }, PLATES, SPREAD, ANISO);
      expect(f.get(target.key)).toBe(1);
      for (const other of PLATES) {
        if (other.key === target.key) continue;
        expect(f.get(other.key)!).toBeLessThan(f.get(target.key)!);
      }
    }
  });

  it("orders the field by proximity for a pointer on Email (5d889c9 twitch regression guard)", () => {
    const f = dockFactors({ x: 203, y: 420 }, PLATES, SPREAD, ANISO);
    expect(f.get("email")!).toBeGreaterThan(f.get("github")!);
    expect(f.get("github")!).toBeGreaterThan(f.get("whatsapp")!);
    expect(f.get("whatsapp")!).toBeGreaterThan(f.get("linkedin")!);
    // Design D3 worked example: github 0.422, whatsapp 0.035.
    expect(f.get("github")!).toBeCloseTo(0.422, 2);
    expect(f.get("whatsapp")!).toBeCloseTo(0.035, 2);
  });
});

describe("dockValues", () => {
  it("maps a full factor to the pinned register caps", () => {
    expect(dockValues(1, 1.1, 10, 8)).toEqual({ scale: 1.1, lift: -10, z: 8 });
  });

  it("maps a zero factor to the rest state", () => {
    expect(dockValues(0, 1.1, 10, 8)).toEqual({ scale: 1, lift: 0, z: 0 });
  });

  it("never lets scale exceed the 1.10 cap anywhere across the factor range", () => {
    for (let f = 0; f <= 1; f += 0.05) {
      expect(dockValues(f, 1.1, 10, 8).scale).toBeLessThanOrEqual(1.1);
    }
    expect(dockValues(1, 1.1, 10, 8).scale).toBeLessThanOrEqual(1.1);
  });
});

describe("cardCenter", () => {
  it("returns the untransformed box midpoint from offset geometry, never calling getBoundingClientRect", () => {
    // A plain object, not an Element: were the impl to call
    // getBoundingClientRect this would throw, and the maths can only come
    // from offset*.
    const box = { offsetLeft: 100, offsetTop: 40, offsetWidth: 200, offsetHeight: 80 };
    expect(cardCenter(box)).toEqual({ x: 200, y: 80 });
  });

  it("computes a different midpoint for a different box (arithmetic triangulation)", () => {
    const box = { offsetLeft: 0, offsetTop: 0, offsetWidth: 334, offsetHeight: 344 };
    expect(cardCenter(box)).toEqual({ x: 167, y: 172 });
  });
});
