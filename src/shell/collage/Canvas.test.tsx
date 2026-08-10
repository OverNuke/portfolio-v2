import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ABOUT_PROFILE, SKILLS, SOCIAL_LINKS } from "../../content/data";
import { ROUTES } from "../../routes/routes";
import { Canvas } from "./Canvas";

/**
 * Rewritten 2026-08-06 with the "ghost plate" Home.
 *
 * `useTurn` is mocked for the same reason as in `NavItem.test.tsx`: the
 * turn machine is covered end-to-end in `TurnProvider.test.tsx`; this file
 * only proves Canvas composes the right content and wires the right
 * controls.
 *
 * What is deliberately asserted here is the ACCESSIBILITY CONTRACT, not
 * the layout — layout is `home.css`'s job and `collage.test.ts` /
 * `audit:collage` cover it. The things that would silently break and that
 * nothing else would catch:
 *   · the split masthead must not reach the accessibility tree (it would
 *     announce the name twice, fragmented);
 *   · the rail must follow `Skill.core` rather than a literal;
 *   · channel links must be named by their address, not by "GitHub".
 */
const goMock = vi.hoisted(() => vi.fn());

vi.mock("../../turn/useTurn", () => ({
  useTurn: () => ({ go: goMock, layerMounted: false }),
}));

const CORE_SKILLS = SKILLS.filter((skill) => skill.core);
const MODULES = ROUTES.filter((route) => route.pageId !== "contact");
const CONTACT_ROUTE = ROUTES.find((route) => route.pageId === "contact")!;

describe("Canvas", () => {
  beforeEach(() => {
    goMock.mockClear();
  });

  it("exposes the full name once, as the page heading", () => {
    render(<Canvas />);

    // `name:` is an exact match, so this alone proves the decorative
    // fragments are not contributing: if either reached the tree the
    // accessible name would be the whole thing twice over.
    expect(
      screen.getByRole("heading", { level: 1, name: ABOUT_PROFILE.fullName }),
    ).toBeInTheDocument();
  });

  it("hides the split masthead from assistive tech", () => {
    const { container } = render(<Canvas />);

    // Text queries deliberately ignore aria-hidden, so this has to be
    // asserted on the attribute rather than through queryByText — which is
    // exactly the mistake the first version of this test made.
    for (const cls of [".hm-name__given", ".hm-name__family"]) {
      expect(container.querySelector(cls)).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("lists every routed module inside the Primary landmark, and omits contact", () => {
    render(<Canvas />);
    const nav = screen.getByRole("navigation", { name: "Primary" });

    for (const route of MODULES) {
      expect(
        within(nav).getByRole("button", { name: new RegExp(route.title, "i") }),
      ).toBeInTheDocument();
    }

    // Contact keeps its route; it is simply not a module row, because its
    // channels are on this page.
    expect(
      screen.queryByRole("button", { name: new RegExp(CONTACT_ROUTE.title, "i") }),
    ).not.toBeInTheDocument();
  });

  it("index rows drive the turn machine, passing the row as the opener", async () => {
    const user = userEvent.setup();
    render(<Canvas />);

    const profileRow = screen.getByRole("button", { name: /profile/i });
    await user.click(profileRow);

    expect(goMock).toHaveBeenCalledTimes(1);
    // NavItem hands `go()` its own button so the reverse turn has somewhere
    // to put focus back.
    expect(goMock).toHaveBeenCalledWith("/profile", profileRow);
  });

  it("renders the stack rail from Skill.core, and states the remainder", () => {
    render(<Canvas />);
    const rail = screen.getByRole("complementary", { name: "Core stack" });

    expect(CORE_SKILLS.length).toBeGreaterThan(0);
    for (const skill of CORE_SKILLS) {
      expect(screen.getByText(skill.name)).toBeInTheDocument();
    }

    // A skill without the flag must not appear — that is the whole point
    // of the flag living in data.ts.
    const unlisted = SKILLS.filter((skill) => !skill.core);
    for (const skill of unlisted) {
      expect(screen.queryByText(skill.name)).not.toBeInTheDocument();
    }

    expect(rail).toHaveTextContent(new RegExp(`\\+ 0?${unlisted.length} more`, "i"));
  });

  it("names each channel link by its address, not by its platform", () => {
    render(<Canvas />);

    for (const link of SOCIAL_LINKS) {
      const address = link.href
        .replace(/^mailto:/, "")
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "");

      const anchor = screen.getByRole("link", { name: address });
      expect(anchor).toHaveAttribute("href", link.href);
    }
  });

  it("marks the photograph decorative", () => {
    const { container } = render(<Canvas />);
    const img = container.querySelector(".hm-hero img");

    // It duplicates the heading and carries nothing the heading does not —
    // same call as the profile plate's portrait.
    expect(img).toHaveAttribute("alt", "");
  });
});
