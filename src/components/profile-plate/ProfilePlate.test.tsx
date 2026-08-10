import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfilePlate } from "./ProfilePlate";
import { ABOUT_PROFILE } from "../../content/data";

/**
 * These assertions guard the accessibility contract documented in
 * ProfilePlate.tsx, not the visual composition — the geometry is verified
 * by the audit script and by eye, but "the decorative mark never reaches a
 * screen reader" is the kind of thing that silently regresses.
 */
describe("ProfilePlate", () => {
  it("exposes the full name as the heading, never the decorative mark fragments", () => {
    render(<ProfilePlate profile={ABOUT_PROFILE} />);

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveAccessibleName(`${ABOUT_PROFILE.firstName} ${ABOUT_PROFILE.lastName}`);

    for (const fragment of ABOUT_PROFILE.mark) {
      expect(screen.queryByText(fragment, { ignore: "[aria-hidden='true']" })).toBeNull();
    }
  });

  it("renders the plate facts as real text", () => {
    render(<ProfilePlate profile={ABOUT_PROFILE} />);

    expect(screen.getByText(ABOUT_PROFILE.summary)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PROFILE.role)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PROFILE.location)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PROFILE.openTo)).toBeInTheDocument();
  });

  it("leaves the portrait decorative — it duplicates the heading, so it gets no alt text", () => {
    const { container } = render(<ProfilePlate profile={ABOUT_PROFILE} />);

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("omits the status chip entirely when no label is given", () => {
    const { container, rerender } = render(<ProfilePlate profile={ABOUT_PROFILE} />);
    expect(container.querySelector(".profile-plate__status")).toBeNull();

    rerender(<ProfilePlate profile={ABOUT_PROFILE} statusLabel="ONLINE" />);
    expect(screen.getByRole("button", { name: "ONLINE" })).toBeInTheDocument();
  });

  it("fires onStatusClick when the chip is activated — it's the sheet's only CTA", async () => {
    const user = userEvent.setup();
    const onStatusClick = vi.fn();
    render(
      <ProfilePlate profile={ABOUT_PROFILE} statusLabel="ONLINE" onStatusClick={onStatusClick} />,
    );

    await user.click(screen.getByRole("button", { name: "ONLINE" }));

    expect(onStatusClick).toHaveBeenCalledTimes(1);
  });
});
