import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "./ProfilePage";
import { ABOUT_PROFILE } from "../content/data";

/**
 * `useTurn` is mocked the same way `Canvas.test.tsx` mocks it: the turn
 * machine's own animation/timing is covered end-to-end elsewhere
 * (`TurnProvider.test.tsx`), so this file only proves ProfilePage wires the
 * right control to the right destination.
 */
const goMock = vi.hoisted(() => vi.fn());

vi.mock("../turn/useTurn", () => ({
  useTurn: () => ({ go: goMock }),
}));

function renderProfilePage() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    goMock.mockClear();
  });

  it("renders the real identity, role, and bio from ABOUT_PROFILE", () => {
    renderProfilePage();
    expect(
      screen.getByText(`${ABOUT_PROFILE.firstName} ${ABOUT_PROFILE.lastName}`),
    ).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PROFILE.role)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PROFILE.bio)).toBeInTheDocument();
  });

  it("sends the status chip to /contact — the sheet's only CTA now", async () => {
    const user = userEvent.setup();
    renderProfilePage();
    const chip = screen.getByRole("button", { name: ABOUT_PROFILE.status });

    await user.click(chip);

    expect(goMock).toHaveBeenCalledWith("/contact", chip);
    expect(screen.queryByText("PRESS START")).not.toBeInTheDocument();
    expect(screen.queryByText("CONTINUE")).not.toBeInTheDocument();
  });
});
