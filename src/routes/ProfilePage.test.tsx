import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ProfilePage } from "./ProfilePage";
import { ABOUT_PROFILE, PROFILE_PANELS } from "../content/data";
import { TurnProvider } from "../turn/TurnProvider";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <TurnProvider>
        <ProfilePage />
      </TurnProvider>
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  it("wraps the hero in a Panel with no title and no metadata line", () => {
    const { container } = renderPage();
    // PageLayer (not present in this harness) owns the <h1>; Panel gets
    // neither `title` nor `metadata`, like every other routed page.
    expect(container.querySelector(".panel")).toBeInTheDocument();
    expect(container.querySelector(".panel__head")).not.toBeInTheDocument();
    expect(container.querySelector(".panel__metadata")).not.toBeInTheDocument();
    expect(screen.queryByText("identity on file")).not.toBeInTheDocument();
  });

  it("carries the whole name as the section heading", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: ABOUT_PROFILE.fullName }),
    ).toBeInTheDocument();
  });

  it("renders the four portrait panels as buttons that open an enlarged view", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const panelButtons = container.querySelectorAll<HTMLButtonElement>(".profile-hero__panel");
    expect(panelButtons).toHaveLength(PROFILE_PANELS.length);
    for (const button of panelButtons) {
      expect(button.tagName).toBe("BUTTON");
    }

    await user.click(panelButtons[0]);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("img")).toHaveAttribute("alt", PROFILE_PANELS[0].alt);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the CV slot a non-link placeholder while ABOUT_PROFILE has no cv", () => {
    // Delete this assertion the day `ABOUT_PROFILE.cv` is filled in.
    expect(ABOUT_PROFILE.cv).toBeUndefined();
    const { container } = renderPage();
    const cv = container.querySelector(".profile-hero__cv")!;
    expect(cv.tagName).toBe("DIV");
    expect(cv).not.toHaveAttribute("href");
  });

  it("exposes exactly one Oxblood control — the open-to-work chip", () => {
    const { container } = renderPage();
    const chip = container.querySelector(".profile-hero__status")!;
    expect(chip.tagName).toBe("BUTTON");
    expect(chip).toHaveAccessibleName(ABOUT_PROFILE.availability);
  });
});
