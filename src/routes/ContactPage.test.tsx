import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ContactPage } from "./ContactPage";
import { ABOUT_PROFILE, SOCIAL_LINKS } from "../content/data";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/contact"]}>
      <ContactPage />
    </MemoryRouter>,
  );
}

describe("ContactPage", () => {
  it("renders one plate per entry in SOCIAL_LINKS, in SOCIAL_LINKS order", () => {
    const { container } = renderPage();
    const plates = [...container.querySelectorAll<HTMLElement>(".cf-card")];
    expect(plates).toHaveLength(SOCIAL_LINKS.length);
    expect(plates.map((a) => a.dataset.channel)).toEqual(
      SOCIAL_LINKS.map((l) => l.label.toLowerCase()),
    );
  });

  it("starts every accessible name with the channel name", () => {
    // This has regressed once. The banner variant led with the handle,
    // because `space-between` centres a middle child and the name looked
    // better centred there — and GitHub announced as "@OVERNUKE GITHUB".
    // A link list read in a screen reader is the whole point of this page.
    renderPage();
    for (const link of SOCIAL_LINKS.filter((l) => !l.unresolved)) {
      const anchor = screen.getByRole("link", { name: new RegExp(`^${link.label}\\b`, "i") });
      expect(anchor).toHaveAttribute("href", link.href);
    }
  });

  it("keeps the availability status in the accessibility tree", () => {
    // The marker is the only place this page states it. `aria-hidden` cannot
    // be un-set by a descendant, so putting it on the figure WRAPPER rather
    // than on the image silently deletes this — invisibly, at every width.
    renderPage();
    expect(screen.getByText(ABOUT_PROFILE.availability)).toBeInTheDocument();
  });

  it("keeps every decorative mark out of the accessibility tree", () => {
    const { container } = renderPage();
    const decorative = [
      ".cf__figure-img",
      ".cf__mark-box",
      ".cf__conn",
      ".cf__accent--coord",
      ".cf__accent--sn",
    ];
    for (const selector of decorative) {
      const el = container.querySelector(selector);
      expect(el, `${selector} should render`).not.toBeNull();
      expect(el, `${selector} should be aria-hidden`).toHaveAttribute("aria-hidden", "true");
    }
    // ...but the wrapper that HOLDS the label must not be.
    expect(container.querySelector(".cf__figure")).not.toHaveAttribute("aria-hidden");
  });

  it("opens external channels in a new tab and says so, but not mailto:", () => {
    const { container } = renderPage();
    for (const anchor of container.querySelectorAll<HTMLAnchorElement>("a.cf-card")) {
      const external = !anchor.getAttribute("href")?.startsWith("mailto:");
      if (external) {
        expect(anchor).toHaveAttribute("target", "_blank");
        expect(anchor.getAttribute("rel")).toContain("noopener");
        expect(anchor.textContent).toContain("opens in a new tab");
      } else {
        expect(anchor).not.toHaveAttribute("target");
        expect(anchor.textContent).not.toContain("opens in a new tab");
      }
    }
  });

  it("prints the handle, never the raw href", () => {
    // "@OverNuke" is not "https://github.com/OverNuke". A bare URL in a 123px
    // banner is how a layout gets broken by its own data.
    const { container } = renderPage();
    for (const link of SOCIAL_LINKS) {
      const anchor = container.querySelector(`[data-channel="${link.label.toLowerCase()}"]`);
      // `text-transform` is presentation; the DOM still carries the original.
      expect(anchor?.textContent).toContain(link.handle);
    }
  });

  it("never puts a placeholder address into an href", () => {
    // The guarantee that matters: whatever is sitting in SOCIAL_LINKS, no
    // placeholder can reach a real link. An unresolved channel keeps its
    // plate and loses its href.
    const { container } = renderPage();
    for (const anchor of container.querySelectorAll<HTMLAnchorElement>("a.cf-card")) {
      expect(anchor.getAttribute("href")).not.toContain("PLACEHOLDER");
    }
    for (const link of SOCIAL_LINKS.filter((l) => l.unresolved)) {
      const plate = container.querySelector(`[data-channel="${link.label.toLowerCase()}"]`);
      expect(plate, `${link.label} should still hold its slot`).not.toBeNull();
      expect(plate?.tagName).toBe("DIV");
      expect(plate).not.toHaveAttribute("href");
    }
  });

  it("still has channels waiting on a real address", () => {
    // Not a failure — a visible reminder in the test output. Delete this
    // test when SOCIAL_LINKS has no `unresolved` entries left.
    const pending = SOCIAL_LINKS.filter((l) => l.unresolved).map((l) => l.label);
    expect(pending).toEqual(["WhatsApp", "Instagram"]);
  });
});
