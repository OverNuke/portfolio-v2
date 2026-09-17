import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/shell/AppShell";
import { TurnProvider } from "./TurnProvider";

// Spec app-shell scenario "close returns to Home and restores focus [PW]" —
// the DOM-focus half is real-layout-independent (D15), so it's asserted
// here in jsdom rather than deferred entirely to Playwright.
function Setup() {
  return (
    <MemoryRouter initialEntries={["/profile"]}>
      <TurnProvider>
        <AppShell
          home={<button data-turn-open="/profile">open profile</button>}
          page={
            <Routes>
              <Route path="/profile" element={<div data-testid="page-content">profile</div>} />
            </Routes>
          }
        />
      </TurnProvider>
    </MemoryRouter>
  );
}

describe("TurnProvider focus restore", () => {
  it("returns focus to the nav item that opened the page, on Escape", async () => {
    render(<Setup />);
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    // Escape (useTurnKeys) navigates back to "/" before this fires.
    expect(await screen.findByText("open profile")).toHaveFocus();
  });
});
