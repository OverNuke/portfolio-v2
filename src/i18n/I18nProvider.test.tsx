import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "./I18nProvider";

function Probe() {
  const { locale, t, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="label">{t("nav.certifications")}</span>
      <button onClick={() => setLocale("es")}>go es</button>
    </div>
  );
}

describe("I18nProvider", () => {
  it("defaults to English and syncs <html lang>", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("label")).toHaveTextContent("Distinction");
    expect(document.documentElement.lang).toBe("en");
  });

  it("switches locale and <html lang> together", async () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByText("go es"));
    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(screen.getByTestId("label")).toHaveTextContent("Distinción");
    expect(document.documentElement.lang).toBe("es");
  });

  it("throws if useI18n is used outside the provider", () => {
    const Bare = () => {
      useI18n();
      return null;
    };
    expect(() => render(<Bare />)).toThrow();
  });
});
