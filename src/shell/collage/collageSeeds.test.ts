import { describe, expect, it } from "vitest";
import { pickWeightedSeed } from "./collageSeeds";

/**
 * Boundary-value tests on an injected rng, not an N-trial statistical
 * distribution test — a stats-based test would reintroduce exactly the kind
 * of flakiness the seed-selection mechanism exists to avoid elsewhere.
 */
describe("pickWeightedSeed", () => {
  it.each([
    [0, "common-a"],
    [0.224, "common-a"],
    [0.225, "common-b"],
    [0.449, "common-b"],
    [0.45, "common-c"],
    [0.674, "common-c"],
    [0.675, "common-d"],
    [0.899, "common-d"],
    [0.9, "rare-easter-egg"],
    [0.999999, "rare-easter-egg"],
  ] as const)("rng() = %s picks %s", (roll, expected) => {
    expect(pickWeightedSeed(() => roll)).toBe(expected);
  });
});
