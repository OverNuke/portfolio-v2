import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "./I18nProvider";
import { LanguageToggle } from "./LanguageToggle";

function NavLabel() {
  const { t } = useI18n();
  return <span data-testid="nav-label">{t("nav.profile")}</span>;
}

describe("LanguageToggle", () => {
  it("is reachable by Tab and switches locale on Enter (R3 defect fix)", async () => {
    render(
      <I18nProvider>
        <LanguageToggle />
        <NavLabel />
      </I18nProvider>,
    );
    expect(screen.getByTestId("nav-label")).toHaveTextContent("Profile");

    await userEvent.tab();
    await userEvent.tab();
    const esButton = screen.getByRole("button", { name: "ES" });
    expect(esButton).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(screen.getByTestId("nav-label")).toHaveTextContent("Perfil");
    expect(document.documentElement.lang).toBe("es");
  });

  it("renders real buttons, not a bare role=button div", () => {
    render(
      <I18nProvider>
        <LanguageToggle />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: "EN" }).tagName).toBe("BUTTON");
    expect(screen.getByRole("button", { name: "ES" }).tagName).toBe("BUTTON");
  });
});
