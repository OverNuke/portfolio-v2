import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ProjectsSection } from "./ProjectsSection";

function renderProjects(defaultLocale?: "en" | "es") {
  return render(
    <I18nProvider defaultLocale={defaultLocale}>
      <ProjectsSection />
    </I18nProvider>,
  );
}

describe("ProjectsSection", () => {
  it("renders a visually-hidden accessible heading and the 3 project titles", () => {
    renderProjects();
    expect(screen.getByRole("heading", { name: /^projects$/i })).toBeInTheDocument();
    expect(screen.getByText("Barbershop")).toBeInTheDocument();
    expect(screen.getByText("Acopiatech")).toBeInTheDocument();
    expect(screen.getByText("Odoo Custom Module")).toBeInTheDocument();
  });

  it("exposes real, reachable GitHub links for the 2 public projects, opened in a new tab", () => {
    renderProjects();
    const barbershopLink = screen.getByRole("link", { name: /github.*barbershop/i });
    expect(barbershopLink).toHaveAttribute("href", "https://github.com/overnuke");
    expect(barbershopLink).toHaveAttribute("target", "_blank");
    expect(barbershopLink).toHaveAttribute("rel", "noreferrer");
    const acopiatechLink = screen.getByRole("link", { name: /github.*acopiatech/i });
    expect(acopiatechLink).toHaveAttribute("href", "https://github.com/overnuke");
  });

  it("never links the private Odoo project — shows a non-interactive label instead", () => {
    renderProjects();
    expect(screen.queryByRole("link", { name: /github.*odoo/i })).not.toBeInTheDocument();
    expect(screen.getByText(/private repository/i)).toBeInTheDocument();
  });

  it("renders translated title for the active locale", () => {
    renderProjects("es");
    expect(screen.getByRole("heading", { name: /^proyectos$/i })).toBeInTheDocument();
  });
});
