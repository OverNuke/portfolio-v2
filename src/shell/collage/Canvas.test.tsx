import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ABOUT_PROFILE, SKILLS } from "../../content/data";
import { Canvas } from "./Canvas";

/**
 * Rewritten 2026-08-11: the module wheel (and the caption rail that used to
 * describe its selection) was promoted OUT of `Canvas` entirely into
 * `shell/wheel/` (a `position: fixed` DOM sibling of `Shell`, mounted from
 * `App.tsx`) so it keeps working from every routed page, not only from
 * Home. `Canvas` no longer holds any wheel-related state or renders
 * `ModuleWheel` — it is purely the decorative composition now (masthead,
 * photograph, meta, role, stack), so this file only proves that. Wheel
 * behavior (gate/trigger, Space/Escape, selection, commit, closing on
 * navigate) is covered by `shell/wheel/ModuleWheel.test.tsx` and the
 * cross-cutting integration assertions in `App.test.tsx`.
 */
const CORE_SKILLS = SKILLS.filter((skill) => skill.core);
const UNLISTED = SKILLS.filter((skill) => !skill.core);

describe("Canvas", () => {
  it("exposes the full name once, as the page heading", () => {
    render(<Canvas />);

    // `name:` is an exact match, so this alone proves the painted copies
    // are not contributing: if either reached the tree the accessible name
    // would carry the surname twice over.
    expect(
      screen.getByRole("heading", { level: 1, name: ABOUT_PROFILE.fullName }),
    ).toBeInTheDocument();
  });

  it("hides both masthead copies from assistive tech", () => {
    const { container } = render(<Canvas />);

    // Text queries deliberately ignore aria-hidden, so this has to be
    // asserted on the attribute rather than through queryByText.
    const copies = container.querySelectorAll(".hm-mast");
    expect(copies).toHaveLength(2);
    for (const copy of copies) {
      expect(copy).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("carries the role independently of the intro (design D6)", () => {
    render(<Canvas />);
    expect(screen.getByText(ABOUT_PROFILE.role)).toBeInTheDocument();
  });

  it("holds the hero slot as a reserved, imageless placeholder (sdd/drop-intro-hero-placeholder)", () => {
    const { container } = render(<Canvas />);

    // The seated-cutout photograph is gone — the slot is a transparent,
    // footprint-holding placeholder (design D3) until the editorial Home
    // redesign replaces it. No <img>, still aria-hidden.
    const hero = container.querySelector(".hm-hero");
    expect(hero).toHaveAttribute("aria-hidden", "true");
    expect(hero?.querySelector("img")).toBeNull();

    // .hm-shade (the contact-shade anti-sticker device under the cutout,
    // design D4) is removed outright, not hidden — a shade under nothing
    // reads as a rendering bug.
    expect(container.querySelector(".hm-shade")).toBeNull();
  });

  it("does not render the module wheel or the retired index rows", () => {
    const { container } = render(<Canvas />);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector(".nav-item")).not.toBeInTheDocument();
    expect(container.querySelector(".hm-channels")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("renders the stack from Skill.core, and states the remainder", () => {
    render(<Canvas />);
    const stack = screen.getByRole("complementary", { name: "Core stack" });

    expect(CORE_SKILLS.length).toBeGreaterThan(0);
    for (const skill of CORE_SKILLS) {
      expect(within(stack).getByText(skill.name)).toBeInTheDocument();
    }

    // A skill without the flag must not appear — that is the whole point of
    // the flag living in data.ts.
    for (const skill of UNLISTED) {
      expect(within(stack).queryByText(skill.name)).not.toBeInTheDocument();
    }

    expect(stack).toHaveTextContent(new RegExp(`\\+ 0?${UNLISTED.length} more`, "i"));
  });
});
