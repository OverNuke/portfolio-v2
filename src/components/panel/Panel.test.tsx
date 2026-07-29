import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Panel } from "./Panel";

/**
 * Task 2.2 (sdd/phase2-app-shell), doc 04 Panel contract: title, status,
 * metadata, content. `status` is a short technical-label string, never
 * dropped — an absent or whitespace-only status renders the literal
 * fallback text "SYSTEM NOMINAL" instead of a blank/missing slot.
 */
describe("Panel", () => {
  it("renders the literal fallback status when no status prop is given", () => {
    render(<Panel title="Test Panel" />);
    expect(screen.getByText("SYSTEM NOMINAL")).toBeInTheDocument();
  });

  it("renders the literal fallback status when status is whitespace-only", () => {
    render(<Panel title="Test Panel" status="   " />);
    expect(screen.getByText("SYSTEM NOMINAL")).toBeInTheDocument();
  });

  it("renders the provided status when it is a non-empty string", () => {
    render(<Panel title="Test Panel" status="PAGE 01" />);
    expect(screen.getByText("PAGE 01")).toBeInTheDocument();
    expect(screen.queryByText("SYSTEM NOMINAL")).not.toBeInTheDocument();
  });

  it("renders title, metadata, and content slots", () => {
    render(
      <Panel title="Test Panel" metadata={<span>meta-info</span>} content={<p>body copy</p>} />,
    );
    expect(screen.getByText("Test Panel")).toBeInTheDocument();
    expect(screen.getByText("meta-info")).toBeInTheDocument();
    expect(screen.getByText("body copy")).toBeInTheDocument();
  });
});
