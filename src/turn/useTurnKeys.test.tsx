import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useTurnKeys } from "./useTurnKeys";

function Harness({ turnTo, path }: { turnTo: (p: string) => void; path: string }) {
  useTurnKeys(turnTo, path);
  return (
    <div>
      <a href="/profile" data-turn-open="/profile" tabIndex={0}>
        Profile
      </a>
      <input aria-label="email" />
    </div>
  );
}

describe("useTurnKeys", () => {
  it("ArrowRight navigates back to Home from a page", async () => {
    const turnTo = vi.fn();
    render(<Harness turnTo={turnTo} path="/profile" />);
    await userEvent.keyboard("{ArrowRight}");
    expect(turnTo).toHaveBeenCalledWith("/");
  });

  it("Escape navigates back to Home from a page", async () => {
    const turnTo = vi.fn();
    render(<Harness turnTo={turnTo} path="/profile" />);
    await userEvent.keyboard("{Escape}");
    expect(turnTo).toHaveBeenCalledWith("/");
  });

  it("does nothing on Escape/ArrowRight when already on Home", async () => {
    const turnTo = vi.fn();
    render(<Harness turnTo={turnTo} path="/" />);
    await userEvent.keyboard("{Escape}");
    expect(turnTo).not.toHaveBeenCalled();
  });

  it("ArrowLeft opens the focused nav item's route", async () => {
    const turnTo = vi.fn();
    render(<Harness turnTo={turnTo} path="/" />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    expect(turnTo).toHaveBeenCalledWith("/profile");
  });

  it("bails when focus is inside a real form field", async () => {
    const turnTo = vi.fn();
    render(<Harness turnTo={turnTo} path="/contact" />);
    const input = screen.getByLabelText("email");
    input.focus();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{Escape}");
    expect(turnTo).not.toHaveBeenCalled();
  });
});
