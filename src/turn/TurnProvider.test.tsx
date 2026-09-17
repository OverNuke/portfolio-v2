import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { TurnProvider, useTurn } from "./TurnProvider";

function Probe() {
  const { direction, turnTo } = useTurn();
  return (
    <div>
      <span data-testid="direction">{direction}</span>
      <button onClick={() => turnTo("/profile")}>open profile</button>
    </div>
  );
}

function App({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <TurnProvider>
        <Routes>
          <Route path="/" element={<Probe />} />
          <Route path="/profile" element={<Probe />} />
        </Routes>
      </TurnProvider>
    </MemoryRouter>
  );
}

describe("TurnProvider", () => {
  it("reports forward direction when navigating from Home into a page", async () => {
    render(<App initialPath="/" />);
    await userEvent.click(screen.getByText("open profile"));
    expect(await screen.findByTestId("direction")).toHaveTextContent("forward");
  });

  it("throws if useTurn is used outside the provider", () => {
    const Bare = () => {
      useTurn();
      return null;
    };
    expect(() => render(<Bare />)).toThrow();
  });
});
