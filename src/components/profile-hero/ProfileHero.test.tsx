import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfileHero } from "./ProfileHero";
import { ABOUT_PROFILE, PROFILE_PANELS } from "../../content/data";

/**
 * Guards the accessibility contract in ProfileHero.tsx — the geometry is
 * verified by `scripts/audit.mjs` and by eye; "the decorative fragment
 * never reaches a screen reader" and "the lightbox returns focus" are what
 * regress silently.
 */
describe("ProfileHero", () => {
  it("announces the whole name as a heading, never the painted fragments", () => {
    render(<ProfileHero profile={ABOUT_PROFILE} panels={PROFILE_PANELS} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAccessibleName(ABOUT_PROFILE.fullName);

    // "Frías" / "García" are painted, aria-hidden display lines.
    expect(screen.queryByText("García", { ignore: "[aria-hidden='true']" })).toBeNull();
  });

  it("renders four panels, each a real button named by its portrait alt", () => {
    render(<ProfileHero profile={ABOUT_PROFILE} panels={PROFILE_PANELS} />);

    for (const panel of PROFILE_PANELS) {
      const button = screen.getByRole("button", { name: new RegExp(panel.alt.slice(0, 24), "i") });
      expect(button.tagName).toBe("BUTTON");
    }
  });

  it("keeps captions and the manga SFX out of the accessibility tree", () => {
    const { container } = render(<ProfileHero profile={ABOUT_PROFILE} panels={PROFILE_PANELS} />);

    for (const el of container.querySelectorAll(".profile-hero__panel-cap, .profile-hero__sfx")) {
      expect(el).toHaveAttribute("aria-hidden", "true");
    }
    // The handle text is present but hidden — never a second announcement.
    expect(screen.queryByText("OverNuke", { ignore: "[aria-hidden='true']" })).toBeNull();
  });

  it("opens a dialog with the enlarged portrait, then Escape closes it and returns focus", async () => {
    const user = userEvent.setup();
    render(<ProfileHero profile={ABOUT_PROFILE} panels={PROFILE_PANELS} />);

    const [firstPanel] = PROFILE_PANELS;
    const panelButton = screen.getByRole("button", {
      name: new RegExp(firstPanel.alt.slice(0, 24), "i"),
    });
    await user.click(panelButton);

    const dialog = screen.getByRole("dialog");
    // Same pattern as ProjectField's record zoom — no nested aria-modal inside PageLayer's.
    expect(dialog).not.toHaveAttribute("aria-modal");
    expect(within(dialog).getByRole("img")).toHaveAttribute("alt", firstPanel.alt);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(panelButton).toHaveFocus());
  });

  it("renders the CV slot as a non-link chip while no `cv` is set", () => {
    const { container } = render(<ProfileHero profile={ABOUT_PROFILE} panels={PROFILE_PANELS} />);

    const cv = container.querySelector(".profile-hero__cv")!;
    expect(cv.tagName).toBe("DIV");
    expect(cv).not.toHaveAttribute("href");
  });

  it("turns the CV slot into a new-tab link when `cv` is present", () => {
    render(
      <ProfileHero
        profile={{ ...ABOUT_PROFILE, cv: { href: "/cv.pdf", note: "pdf · 1 page" } }}
        panels={PROFILE_PANELS}
      />,
    );

    const link = screen.getByRole("link", { name: /download cv/i });
    expect(link).toHaveAttribute("href", "/cv.pdf");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("fires onStatusClick from the one Oxblood chip", async () => {
    const user = userEvent.setup();
    const onStatusClick = vi.fn();
    const { container } = render(
      <ProfileHero
        profile={ABOUT_PROFILE}
        panels={PROFILE_PANELS}
        onStatusClick={onStatusClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: ABOUT_PROFILE.availability }));
    expect(onStatusClick).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll(".profile-hero__status")).toHaveLength(1);
  });

  it("omits the status chip when no handler is given", () => {
    const { container } = render(<ProfileHero profile={ABOUT_PROFILE} panels={PROFILE_PANELS} />);
    expect(container.querySelector(".profile-hero__status")).toBeNull();
  });

  it("gates every decorative animation behind data-motion (the useReducedMotion contract)", () => {
    // jsdom has no matchMedia, so useReducedMotion resolves false → "full".
    // The CSS only applies panel-hover translate / lightbox fade under
    // [data-motion="full"]; flipping this attribute is the whole switch.
    const { container } = render(<ProfileHero profile={ABOUT_PROFILE} panels={PROFILE_PANELS} />);
    expect(container.querySelector(".profile-hero")).toHaveAttribute("data-motion", "full");
  });
});
