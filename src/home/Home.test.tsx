import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/I18nProvider";
import { TurnProvider } from "@/turn/TurnProvider";
import { Home } from "./Home";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname}</div>;
}

function App() {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <I18nProvider>
        <TurnProvider>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
          <LocationProbe />
        </TurnProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe("Home", () => {
  it("carries name/role as real, non-hidden markup", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Kevin/i);
  });

  it("hides the Ink Flow layer from the accessibility tree", () => {
    const { container } = render(<App />);
    expect(container.querySelector(".ink-flow")).toHaveAttribute("aria-hidden", "true");
  });

  it("nav is reachable by Tab+Enter and opens the route", async () => {
    render(<App />);
    screen.getByRole("link", { name: "Profile" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByTestId("path")).toHaveTextContent("/profile");
  });

  it("ArrowLeft opens the focused nav item's route", async () => {
    render(<App />);
    screen.getByRole("link", { name: "Projects" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByTestId("path")).toHaveTextContent("/projects");
  });

  it("language toggle switches nav labels and <html lang> together", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "ES" }));
    expect(screen.getByRole("link", { name: "Perfil" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("es");
  });
});
