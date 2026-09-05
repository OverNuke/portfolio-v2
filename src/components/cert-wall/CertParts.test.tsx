import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { CertPagerTabs } from "./CertParts";

/** Stub in place of react-router's `Link` — CertPagerTabs takes any
 * `ElementType` and passes it `href` + children, matching `CertWall`'s own
 * `LinkComponent` contract (`RouterPagerLink` in `CertificationsPage.tsx`). */
function StubLink({
  href,
  children,
  ...rest
}: { href: string; children?: ReactNode } & Record<string, unknown>) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

describe("CertPagerTabs — 01/02 number tabs replacing the dot pager (D3/§2.2)", () => {
  it("renders one tab per page, labelled 01/02/03 with the current page NOT a link", () => {
    render(
      <CertPagerTabs
        pageCount={3}
        current={2}
        pagerHref={(n) => `/certifications/${n}`}
        LinkComponent={StubLink}
      />,
    );

    expect(screen.getByRole("link", { name: /sheet 1/i })).toHaveAttribute(
      "href",
      "/certifications/1",
    );
    expect(screen.getByRole("link", { name: /sheet 3/i })).toHaveAttribute(
      "href",
      "/certifications/3",
    );
    // Current page (2) is NOT a link -- inert span, matching the existing
    // dot-pager's "a disabled link still takes focus" precedent.
    expect(screen.queryByRole("link", { name: /sheet 2/i })).not.toBeInTheDocument();
    expect(screen.getByText(/sheet 2, current/i)).toBeInTheDocument();
  });

  it("marks the current tab aria-current=page and gives it no href", () => {
    render(
      <CertPagerTabs
        pageCount={2}
        current={1}
        pagerHref={(n) => `/certifications/${n === 1 ? "" : n}`}
        LinkComponent={StubLink}
      />,
    );

    const current = screen.getByText(/sheet 1, current/i).closest("[aria-current]");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("renders nothing when there is only one page", () => {
    const { container } = render(
      <CertPagerTabs pageCount={1} current={1} pagerHref={(n) => `/${n}`} LinkComponent={StubLink} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
