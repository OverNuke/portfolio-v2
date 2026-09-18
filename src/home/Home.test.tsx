import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import postcss from "postcss";
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

  // T2.1: the wordmark's accessible name must be exactly the full name —
  // the visual "KEVIN." abbreviation lives in an aria-hidden span and must
  // never leak into the accessible-name computation.
  it("wordmark's accessible name is the full name, not the visual 'KEVIN.' abbreviation", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAccessibleName("Kevin Sebastián Frías García");
  });

  it("hides the Ink Flow layer from the accessibility tree", () => {
    const { container } = render(<App />);
    expect(container.querySelector(".ink-flow")).toHaveAttribute("aria-hidden", "true");
  });

  it("nav is reachable by Tab+Enter and opens the route", async () => {
    render(<App />);
    screen.getByRole("link", { name: "Who me?" }).focus();
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
    expect(screen.getByRole("link", { name: "¿Yo?" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("es");
  });

  // T3.7/D3: Home's root carries --font-structure. Vitest's default
  // `test.css: false` means CSS imports are NOT applied in jsdom (verified
  // empirically — getComputedStyle reads back empty for every property on
  // a CSS-file-only style), so a real computed-style assertion isn't
  // reliable here. Static-parse home.css instead, mirroring tokens.test.ts's
  // own established postcss pattern for CSS-file assertions.
  it("home.css declares .home's font-family through --font-structure", () => {
    const css = readFileSync(join(__dirname, "home.css"), "utf-8");
    const root = postcss.parse(css);
    let fontFamily: string | undefined;
    root.walkRules(".home", (rule) => {
      rule.walkDecls("font-family", (decl) => {
        fontFamily = decl.value;
      });
    });
    expect(fontFamily).toBe("var(--font-structure)");
  });
});
