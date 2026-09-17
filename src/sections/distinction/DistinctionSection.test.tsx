import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/I18nProvider";
import { DistinctionSection } from "./DistinctionSection";

function renderDistinction(defaultLocale?: "en" | "es") {
  return render(
    <MemoryRouter>
      <I18nProvider defaultLocale={defaultLocale}>
        <DistinctionSection />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("DistinctionSection", () => {
  it("renders the heading 'Distinctions' and all 9 record cells as real, named buttons", () => {
    renderDistinction();
    expect(screen.getByRole("heading", { name: /distinctions/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /anfeca academic recognition/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /open scan/i })).toHaveLength(9);
  });

  it("lightbox opens on Enter, closes on Escape, and returns focus to the triggering cell", async () => {
    const user = userEvent.setup();
    renderDistinction();
    const cell = screen.getByRole("button", { name: /anfeca academic recognition/i });
    cell.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cell).toHaveFocus();
  });

  it("a cell without a scan asset shows the blinking-eye empty state in its lightbox", async () => {
    const user = userEvent.setup();
    renderDistinction();
    const cell = screen.getByRole("button", { name: /introduction to power bi/i });
    await user.click(cell);
    expect(screen.getByLabelText(/no scan yet/i)).toBeInTheDocument();
  });

  it("renders translated heading for the active locale", () => {
    renderDistinction("es");
    expect(screen.getByRole("heading", { name: /distinciones/i })).toBeInTheDocument();
  });
});
