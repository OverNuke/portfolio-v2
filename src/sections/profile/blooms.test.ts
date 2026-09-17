import { describe, expect, it } from "vitest";
import { bloomFade, bloomRadius, lobe, makeBloom } from "./blooms";

describe("makeBloom", () => {
  it("places the bloom within the given bounds using an injected rng", () => {
    const b = makeBloom(480, 300, false, () => 0.5);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x).toBeLessThanOrEqual(480);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeLessThanOrEqual(300);
  });

  it("seeded blooms start mid-life, unseeded start at age 0", () => {
    const seeded = makeBloom(480, 300, true, () => 0.5);
    const unseeded = makeBloom(480, 300, false, () => 0.5);
    expect(unseeded.age).toBe(0);
    expect(seeded.age).toBeGreaterThan(0);
  });
});

describe("lobe", () => {
  it("is deterministic for a fixed bloom/time/angle", () => {
    const b = makeBloom(480, 300, false, () => 0.5);
    expect(lobe(b, 1, 0.4)).toBe(lobe(b, 1, 0.4));
  });
});

describe("bloomRadius / bloomFade", () => {
  it("radius grows monotonically over the bloom's life (t in [0,1])", () => {
    const b = makeBloom(480, 300, false, () => 0.5);
    const early = bloomRadius(b, 0.1);
    const late = bloomRadius(b, 0.9);
    expect(late).toBeGreaterThan(early);
  });

  it("fade rises then falls back toward 0 near the end of life", () => {
    const rising = bloomFade(0.05);
    const mid = bloomFade(0.4);
    const end = bloomFade(0.98);
    expect(mid).toBeGreaterThan(rising);
    expect(end).toBeLessThan(mid);
  });
});
