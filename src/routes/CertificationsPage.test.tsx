import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { CertificationsPage } from "./CertificationsPage";
import { CERTIFICATES } from "../content/data";
import { ROUTES } from "./routes";

describe("CertificationsPage", () => {
  it("renders one CertificatePlate link per entry in CERTIFICATES, with correct hrefs", () => {
    const { container } = render(
      <MemoryRouter>
        <CertificationsPage />
      </MemoryRouter>,
    );
    for (const certificate of CERTIFICATES) {
      const link = screen.getByRole("link", { name: new RegExp(certificate.title, "i") });
      expect(link).toHaveAttribute("href", certificate.href);
    }
    expect(container.querySelectorAll(".cert-mat")).toHaveLength(CERTIFICATES.length);
  });

  it("keeps the nav route's record count in sync with CERTIFICATES.length", () => {
    const certificationsRoute = ROUTES.find((r) => r.pageId === "certifications")!;
    expect(certificationsRoute.count).toBe(String(CERTIFICATES.length));
    expect(certificationsRoute.sub).toContain(String(CERTIFICATES.length));
  });
});
