import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
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

// T1.1/T1.2: the eye doodles only render in the `scaled` useStageScale
// branch — force it by stubbing the stage's clientWidth and dispatching a
// resize, mirroring src/layout/useStageScale.test.tsx's own technique.
function stubWidth(el: HTMLElement, width: number) {
  Object.defineProperty(el, "clientWidth", { configurable: true, value: width });
}

function renderScaledDistinction() {
  const utils = renderDistinction();
  const stage = screen.getByRole("region");
  stubWidth(stage, 1440);
  act(() => window.dispatchEvent(new Event("resize")));
  return utils;
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

  it("wires eye-left-paper.png/eye-right.png into the count/span cells", () => {
    const { container } = renderScaledDistinction();
    const images = container.querySelectorAll(".distinction__eye-img");
    expect(images).toHaveLength(2);
    images.forEach((img) => {
      expect(img.tagName).toBe("IMG");
      expect(img).toHaveAttribute("alt", "");
      const wrapper = img.parentElement;
      expect(wrapper).toHaveAttribute("aria-hidden", "true");
    });
    const sources = Array.from(images).map((img) => img.getAttribute("src") ?? "");
    expect(sources.some((src) => src.includes("eye-left-paper"))).toBe(true);
    expect(sources.some((src) => src.includes("eye-right") && !src.includes("eye-left"))).toBe(true);
  });

  it("keeps the eye doodles fully static under prefers-reduced-motion: reduce", async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();
    const { container } = renderScaledDistinction();

    const images = Array.from(container.querySelectorAll<HTMLImageElement>(".distinction__eye-img"));
    expect(images).toHaveLength(2);
    images.forEach((img) => {
      const wrapper = img.parentElement;
      expect(wrapper).toHaveAttribute("data-motion", "static");
    });
    const restingTransforms = images.map((img) => img.style.transform);

    const stage = screen.getByRole("region");
    await user.pointer({ target: stage, coords: { x: 900, y: 400 } });

    images.forEach((img, i) => {
      expect(img.style.transform).toBe(restingTransforms[i]);
    });

    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
