import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ContactDock } from "./ContactDock";

describe("ContactDock", () => {
  it("renders exactly the 3 resolved channels as real links (email/github/linkedin)", () => {
    render(
      <I18nProvider>
        <ContactDock />
      </I18nProvider>,
    );
    expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute(
      "href",
      "mailto:ksfgarcia24@gmail.com",
    );
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/overnuke",
    );
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
      "href",
      "https://linkedin.com/in/keffwontwakeup",
    );
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("opens external channels in a new tab safely, keeps email in-tab", () => {
    render(
      <I18nProvider>
        <ContactDock />
      </I18nProvider>,
    );
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("rel", "noreferrer");
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: /email/i })).not.toHaveAttribute("target");
  });

  it("never ships an unresolved destination as a live link (WhatsApp/Cal.com deferred)", () => {
    const { container } = render(
      <I18nProvider>
        <ContactDock />
      </I18nProvider>,
    );
    expect(container.textContent).not.toMatch(/wa\.me/);
    expect(container.textContent).not.toMatch(/cal\.com/);
  });

  it("renders translated heading for the active locale", () => {
    render(
      <I18nProvider defaultLocale="es">
        <ContactDock />
      </I18nProvider>,
    );
    expect(screen.getByText("Hablemos")).toBeInTheDocument();
  });

  it("hides decorative figure and status dot from the accessibility tree", () => {
    const { container } = render(
      <I18nProvider>
        <ContactDock />
      </I18nProvider>,
    );
    expect(container.querySelector(".contact__figure")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".contact__status-dot")).toHaveAttribute("aria-hidden", "true");
  });
});
