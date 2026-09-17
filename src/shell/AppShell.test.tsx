import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

function Setup({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AppShell
        home={<div data-testid="home-content">home</div>}
        page={
          <Routes>
            <Route path="/profile" element={<div data-testid="page-content">profile</div>} />
          </Routes>
        }
      />
    </MemoryRouter>
  );
}

describe("AppShell / PageLayer", () => {
  it("keeps Home mounted and marks its root inert when a page is open", () => {
    render(<Setup initialPath="/profile" />);
    expect(screen.getByTestId("home-root")).toHaveAttribute("inert");
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });

  it("Home is not inert and no page layer renders at /", () => {
    render(<Setup initialPath="/" />);
    expect(screen.getByTestId("home-root")).not.toHaveAttribute("inert");
    expect(screen.queryByTestId("page-layer")).not.toBeInTheDocument();
  });

  it("moves focus into the page layer when a route opens", () => {
    render(<Setup initialPath="/profile" />);
    expect(screen.getByTestId("page-layer")).toHaveFocus();
  });
});
