import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CertWall } from "./CertWall";
import type { Certificate } from "../../content/types";

function makeCertificates(n: number): Certificate[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `cert-${i + 1}`,
    title: `Certificate ${i + 1}`,
    issuer: "Issuer",
    date: "2024",
    category: "academic",
    icon: "award",
    href: `https://example.test/${i + 1}`,
  }));
}

describe("CertWall — landscape tile clip-path shape keying (D2/§2.1)", () => {
  it("keys data-cut off slotIndex % 4, so six landscape tiles cycle 0,1,2,3,0,1", () => {
    const { container } = render(
      <CertWall certificates={makeCertificates(6)} sheet="landscape" />,
    );

    const cuts = Array.from(container.querySelectorAll(".cert-mat")).map((el) =>
      el.getAttribute("data-cut"),
    );
    expect(cuts).toEqual(["0", "1", "2", "3", "0", "1"]);
  });

  it("never repeats a cut on two ADJACENT slots (6-slot rung)", () => {
    const { container } = render(
      <CertWall certificates={makeCertificates(6)} sheet="landscape" />,
    );

    const cuts = Array.from(container.querySelectorAll(".cert-mat")).map((el) =>
      el.getAttribute("data-cut"),
    );
    for (let i = 1; i < cuts.length; i++) {
      expect(cuts[i]).not.toBe(cuts[i - 1]);
    }
  });

  it("does NOT set data-cut on the portrait ladder (scoped to landscape only, §2.1)", () => {
    const { container } = render(
      <CertWall certificates={makeCertificates(3)} sheet="portrait" />,
    );

    const mats = container.querySelectorAll(".cert-mat");
    expect(mats.length).toBeGreaterThan(0);
    for (const mat of mats) {
      expect(mat.getAttribute("data-cut")).toBeNull();
    }
  });
});
