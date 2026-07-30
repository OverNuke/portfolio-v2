import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ProfilePage } from "./ProfilePage";
import { ABOUT_PROFILE } from "../content/data";
import { TurnProvider } from "../turn/TurnProvider";

function renderProfilePage() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <TurnProvider>
        <ProfilePage />
      </TurnProvider>
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  it("renders the real identity, role, and bio from ABOUT_PROFILE", () => {
    renderProfilePage();
    expect(
      screen.getByText(`${ABOUT_PROFILE.firstName} ${ABOUT_PROFILE.lastName}`),
    ).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PROFILE.role)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PROFILE.bio)).toBeInTheDocument();
  });

  it("renders both CTAs as buttons, not dead '#' anchors", () => {
    renderProfilePage();
    expect(screen.getByRole("button", { name: ABOUT_PROFILE.ctaPrimary.label })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: ABOUT_PROFILE.ctaSecondary.label }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
