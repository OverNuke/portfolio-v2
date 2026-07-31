import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CERTIFICATES, SKILLS } from "../../content/data";
import { ROUTES } from "../../routes/routes";
import { SKILLS_SEEDS } from "./collageSeeds";
import { Canvas } from "./Canvas";
import { SkillsCollage } from "./SkillsCollage";

/**
 * Task 3.1 (sdd/phase2-app-shell). Regression check against 2.6/2.7's
 * existing behavior now that NavItem is composed inside the 12x12 collage
 * grid instead of a plain ungrided list (batch 5). `useTurn` is mocked —
 * same rationale as `NavItem.test.tsx`: the turn machine itself is
 * covered end-to-end elsewhere (`TurnProvider.test.tsx`), this file only
 * needs to prove Canvas composes NavItem/ROUTES correctly.
 */
const goMock = vi.hoisted(() => vi.fn());

vi.mock("../../turn/useTurn", () => ({
  useTurn: () => ({ go: goMock }),
}));

describe("Canvas", () => {
  beforeEach(() => {
    goMock.mockClear();
  });

  it("renders the identity content", () => {
    render(<Canvas />);
    expect(
      screen.getByRole("heading", { name: "Kevin Sebastián Frías García" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Full-Stack Developer")).toBeInTheDocument();
  });

  it("renders one real <button> NavItem per route, still reachable via the Primary nav landmark", () => {
    render(<Canvas />);
    const nav = screen.getByRole("navigation", { name: "Primary" });

    for (const route of ROUTES) {
      const button = screen.getByRole("button", { name: new RegExp(route.title, "i") });
      expect(nav).toContainElement(button);
    }
  });

  it("NavItems still activate correctly (click) now that they're inside the grid", async () => {
    const user = userEvent.setup();
    render(<Canvas />);
    const button = screen.getByRole("button", { name: /profile/i });

    await user.click(button);

    expect(goMock).toHaveBeenCalledTimes(1);
    expect(goMock).toHaveBeenCalledWith("/profile", button);
  });

  it("the placeholder spec-cascade plate carries no real content and is aria-hidden", () => {
    const { container } = render(<Canvas />);
    // getByText/queryByText are not accessibility-tree-aware (they match
    // raw DOM text regardless of aria-hidden), so the real assertion here
    // is on the attribute itself, not on query absence.
    const specCascade = container.querySelector(".spec-cascade");
    expect(specCascade).toHaveAttribute("aria-hidden", "true");
    // getByRole IS accessibility-tree-aware — only the real nav, cert-field,
    // and skills-collage <li>s should be exposed as "listitem"s, not the
    // placeholder plate's.
    expect(screen.queryAllByRole("listitem")).toHaveLength(
      ROUTES.length + CERTIFICATES.length + SKILLS.length,
    );
  });

  it("renders one real <a> CertificatePlate per certificate, with correct hrefs", () => {
    render(<Canvas />);

    for (const certificate of CERTIFICATES) {
      const link = screen.getByRole("link", { name: new RegExp(certificate.title, "i") });
      expect(link).toHaveAttribute("href", certificate.href);
    }
  });
});

describe("SkillsCollage seeds", () => {
  it.each(SKILLS_SEEDS)("seed %s renders every SKILLS entry with the matching seed class", (seed) => {
    const { container } = render(<SkillsCollage seedOverride={seed} />);

    // Scoped to `.badge__name` — some icons' <svg><title> text duplicates
    // the skill name (e.g. the CSS icon's title is "CSS"), which an
    // unscoped getByText would collide with.
    for (const skill of SKILLS) {
      expect(screen.getByText(skill.name, { selector: ".badge__name" })).toBeInTheDocument();
    }
    expect(container.querySelector(`.skills-collage--${seed}`)).not.toBeNull();
  });
});
