import { useRef, type ReactNode } from "react";
import { PageLayer } from "./PageLayer";
import "./app-shell.css";

interface AppShellProps {
  home: ReactNode;
  page: ReactNode;
}

// Single-viewport root: Home stays mounted underneath, PageLayer overlays the
// active route on top of it. No-scroll ≥768px lives in app-shell.css (D8),
// released below 768px per WCAG 1.4.10 — that boundary is Playwright-only.
export function AppShell({ home, page }: AppShellProps) {
  const homeRef = useRef<HTMLDivElement>(null);

  return (
    <div className="app-shell">
      <div ref={homeRef} data-testid="home-root" className="app-shell__home">
        {home}
      </div>
      <PageLayer homeRef={homeRef}>{page}</PageLayer>
    </div>
  );
}
