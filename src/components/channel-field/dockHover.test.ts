import { describe, expect, it } from "vitest";
import { dockScale, dockTargets, type DockCard } from "./dockHover";

describe("dockScale", () => {
  it("returns maxScale at zero distance", () => {
    expect(dockScale(0, 240, 1.07)).toBeCloseTo(1.07);
  });

  it("returns 1 once distance reaches the radius", () => {
    expect(dockScale(240, 240, 1.07)).toBe(1);
  });

  it("returns 1 beyond the radius", () => {
    expect(dockScale(500, 240, 1.07)).toBe(1);
  });

  it("stays within [1, maxScale] at the midpoint", () => {
    const mid = dockScale(120, 240, 1.07);
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(1.07);
  });

  it("decreases monotonically as distance grows", () => {
    const samples = [0, 40, 80, 120, 160, 200, 240].map((d) => dockScale(d, 240, 1.07));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeLessThanOrEqual(samples[i - 1]);
    }
  });

  it("returns exactly 1 when maxScale is 1, regardless of distance", () => {
    expect(dockScale(0, 240, 1)).toBe(1);
  });
});

describe("dockTargets", () => {
  // Roughly the geometry that surfaced the bug: three cards close enough
  // together that a single point sits inside all three radii.
  const email: DockCard<string> = { key: "email", centerX: 104, centerY: 303 };
  const github: DockCard<string> = { key: "github", centerX: 281, centerY: 269 };
  const whatsapp: DockCard<string> = { key: "whatsapp", centerX: 447, centerY: 370 };
  const cards = [email, github, whatsapp];

  it("gives every card a target of 1 when the pointer has left the stage", () => {
    const targets = dockTargets<string>(null, cards, 240, 1.07);
    expect([...targets.values()]).toEqual([1, 1, 1]);
  });

  it("only the nearest in-radius card gets a real target — the others stay at 1", () => {
    // Roughly between github and whatsapp, closer to github.
    const targets = dockTargets({ x: 300, y: 300 }, cards, 240, 1.07);
    expect(targets.get("github")).toBeGreaterThan(1);
    expect(targets.get("email")).toBe(1);
    expect(targets.get("whatsapp")).toBe(1);
  });

  it("resolves an exact tie to the first card in the list", () => {
    const a: DockCard<string> = { key: "a", centerX: 0, centerY: 0 };
    const b: DockCard<string> = { key: "b", centerX: 100, centerY: 0 };
    const targets = dockTargets({ x: 50, y: 0 }, [a, b], 240, 1.07);
    expect(targets.get("a")).toBeGreaterThan(1);
    expect(targets.get("b")).toBe(1);
  });

  it("gives every card a target of 1 when none are within radius", () => {
    const targets = dockTargets({ x: 5000, y: 5000 }, cards, 240, 1.07);
    expect([...targets.values()]).toEqual([1, 1, 1]);
  });

  it("returns an empty map for an empty card list", () => {
    expect(dockTargets({ x: 0, y: 0 }, [], 240, 1.07).size).toBe(0);
    expect(dockTargets(null, [], 240, 1.07).size).toBe(0);
  });
});
