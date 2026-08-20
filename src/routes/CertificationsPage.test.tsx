import { render, screen } from "@testing-library/react";
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
});
