import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Project } from "../../content/types";
import { ImageExpandOverlay } from "./ImageExpandOverlay";

const PROJECT: Project = {
  title: "Odoo Custom Module",
  subtitle: "Document management module for a local company",
  description: "Maintenance and new features for a custom Odoo module.",
  tags: ["Odoo", "Python"],
  year: "2025",
  href: "#",
  image: "odoo.png",
  imageAlt: "Odoo document manager screenshot",
};

/**
 * `returnFocusTo` needs a REAL mounted element to call `.focus()` on. A
 * callback ref (`ref={setTrigger}`) is used instead of `useRef` so the
 * overlay only ever renders once the trigger element genuinely exists in
 * the DOM — passing `triggerRef.current` as a prop during the render that
 * creates the ref reads `null`, since refs attach after commit, not during
 * render.
 */
function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(true);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);

  return (
    <div>
      <button ref={setTrigger}>Trigger</button>
      {open && trigger && (
        <ImageExpandOverlay
          project={PROJECT}
          onClose={() => {
            setOpen(false);
            onClose?.();
          }}
          returnFocusTo={trigger}
        />
      )}
    </div>
  );
}

describe("ImageExpandOverlay", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    } else {
      // @ts-expect-error -- restoring jsdom's default absence of matchMedia
      delete window.matchMedia;
    }
  });

  it("moves focus in on open, to the close button", () => {
    render(<Harness />);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /close/i }));
  });

  it("labels itself with the project title, and prints its image with real alt text", () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog", { name: PROJECT.title });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("img", { name: PROJECT.imageAlt })).toBeInTheDocument();
  });

  it("closes and returns focus to the trigger on Escape", () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Trigger" });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes and returns focus to the trigger on ArrowRight, per the site's back/close mapping", () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Trigger" });

    fireEvent.keyDown(document, { key: "ArrowRight" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("ignores Escape/ArrowRight held with a modifier key", () => {
    render(<Harness />);
    fireEvent.keyDown(document, { key: "Escape", shiftKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on clicking the close button", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on clicking the scrim", () => {
    const { container } = render(<Harness />);
    fireEvent.click(container.querySelector(".sheet-overlay__scrim")!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("gates its entrance animation behind prefers-reduced-motion without breaking open/close", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;

    const { container } = render(<Harness />);
    expect(container.querySelector(".sheet-overlay")).toHaveAttribute("data-motion", "reduced");

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
