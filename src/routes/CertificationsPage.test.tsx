import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { CertificationsPage } from "./CertificationsPage";
import { CERTIFICATES } from "../content/data";
import { PER_SHEET_LANDSCAPE } from "../components/cert-wall/certLayouts";
import { ROUTES } from "./routes";

/**
 * The bento redesign (2026-08-17) dropped `PER_SHEET_LANDSCAPE` from 9 to 6
 * — today's 9 certificates now page 6+3 instead of fitting on one sheet, so
 * this test is split into a page-1 and a page-2 case, each asserting its own
 * slice of `CERTIFICATES` rather than the whole array against a single page.
 */
function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/certifications" element={<CertificationsPage />} />
        <Route path="/certifications/:page" element={<CertificationsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CertificationsPage", () => {
  it("page 1 renders a CertLink per entry in its slice, with correct hrefs", () => {
    const page1 = CERTIFICATES.slice(0, PER_SHEET_LANDSCAPE);
    const { container } = renderAtPath("/certifications");

    for (const certificate of page1) {
      const link = screen.getByRole("link", { name: new RegExp(certificate.title, "i") });
      expect(link).toHaveAttribute("href", certificate.href);
    }
    expect(container.querySelectorAll(".cert-mat")).toHaveLength(page1.length);
  });

  it("page 2 renders the remaining CERTIFICATES entries, with correct hrefs", () => {
    const page2 = CERTIFICATES.slice(PER_SHEET_LANDSCAPE);
    const { container } = renderAtPath("/certifications/2");

    for (const certificate of page2) {
      const link = screen.getByRole("link", { name: new RegExp(certificate.title, "i") });
      expect(link).toHaveAttribute("href", certificate.href);
    }
    expect(container.querySelectorAll(".cert-mat")).toHaveLength(page2.length);
  });

  it("keeps the nav route's record count in sync with CERTIFICATES.length", () => {
    const certificationsRoute = ROUTES.find((r) => r.pageId === "certifications")!;
    expect(certificationsRoute.count).toBe(String(CERTIFICATES.length));
    expect(certificationsRoute.sub).toContain(String(CERTIFICATES.length));
  });

  /**
   * §2.3 (D3, `sdd/design-import-sections`): arrow-key sheet paging is NEW
   * work, not a reuse of an existing handler — `useFieldKeyboard`
   * (`src/turn/useFieldKeyboard.ts`) wired here for the first time. House
   * convention, NOT the mockup's inverted binding: Left = forward (next
   * sheet), Right = back (previous sheet).
   */
  describe("arrow-key sheet paging (CW5, useFieldKeyboard)", () => {
    it("ArrowLeft on sheet 1 navigates to sheet 2 (forward)", () => {
      renderAtPath("/certifications");
      expect(screen.getByText(/sheet 1, current/i)).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "ArrowLeft" });

      expect(screen.getByText(/sheet 2, current/i)).toBeInTheDocument();
    });

    it("ArrowRight on sheet 2 navigates back to sheet 1", () => {
      renderAtPath("/certifications/2");
      expect(screen.getByText(/sheet 2, current/i)).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "ArrowRight" });

      expect(screen.getByText(/sheet 1, current/i)).toBeInTheDocument();
    });

    it("ArrowLeft on the LAST sheet does nothing (no onForward past pageCount)", () => {
      renderAtPath("/certifications/2");
      expect(screen.getByText(/sheet 2, current/i)).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "ArrowLeft" });

      // Still on sheet 2 -- there is no sheet 3 to advance to.
      expect(screen.getByText(/sheet 2, current/i)).toBeInTheDocument();
    });

    /**
     * Real collision found while writing the e2e coverage for this task
     * (task 4.8): `CertScanModal` already owns a document-level,
     * capture-phase Escape/ArrowRight-to-close listener. `useFieldKeyboard`
     * is now ALSO a document-level, capture-phase ArrowRight listener
     * (this task's new wiring). Both listeners live on the same node in the
     * same phase, so `stopPropagation()` (neither hook calls
     * `stopImmediatePropagation`) does not stop the other from firing —
     * without a guard, one ArrowRight both closes the modal AND pages the
     * sheet out from under it. Fix follows this repo's own precedent
     * (`useTurnKeyboard` standing down while `useWheelOpen()` is true —
     * "topmost-closes-first"): the sheet's arrow keys go inert while a scan
     * is open.
     */
    it("does NOT also page the sheet when ArrowRight closes an open scan modal", () => {
      const { container } = renderAtPath("/certifications/2");
      expect(screen.getByText(/sheet 2, current/i)).toBeInTheDocument();

      const trigger = container.querySelector(".cert-mat__trigger") as HTMLButtonElement;
      fireEvent.click(trigger);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "ArrowRight" });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      // Still on sheet 2 -- the modal closing must not ALSO page the sheet.
      expect(screen.getByText(/sheet 2, current/i)).toBeInTheDocument();
    });
  });
});
