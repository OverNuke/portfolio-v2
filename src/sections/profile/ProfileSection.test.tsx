import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ProfileSection } from "./ProfileSection";

function renderProfile(defaultLocale?: "en" | "es") {
  return render(
    <MemoryRouter>
      <I18nProvider defaultLocale={defaultLocale}>
        <ProfileSection />
      </I18nProvider>
    </MemoryRouter>,
  );
}

function mockMatchMedia(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList);
}

describe("ProfileSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders identity text and survives reduced-motion collapse (canvas context is null in jsdom)", () => {
    mockMatchMedia(true);
    renderProfile();
    expect(screen.getByRole("heading", { name: /junior software engineer/i })).toBeInTheDocument();
    expect(screen.getByText(/universidad veracruzana/i)).toBeInTheDocument();
  });

  it("chamber cell keyboard toggle: Enter toggles aria-pressed", async () => {
    const user = userEvent.setup();
    renderProfile();
    const chamber = screen.getByRole("button", { name: /software — java, javascript, python/i });
    expect(chamber).toHaveAttribute("aria-pressed", "false");
    chamber.focus();
    await user.keyboard("{Enter}");
    expect(chamber).toHaveAttribute("aria-pressed", "true");
  });

  it("renders translated heading for the active locale", () => {
    renderProfile("es");
    expect(screen.getByRole("heading", { name: /ingeniero de software junior/i })).toBeInTheDocument();
  });
});
