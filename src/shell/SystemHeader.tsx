import "./shell.css";

/**
 * Task 2.5 (sdd/phase2-app-shell), design z-index table ("Frame (header/
 * status)" -> `--z-frame`) + doc11/proof `.system-header`. Minimal port of
 * the Frame chrome's top band — the wordmark only; header-meta/clock (build
 * rev, live-dot, glitch labels) are Phase 4 (channel row/glitch layer per
 * CLAUDE.md's doc table), explicitly out of scope here.
 */
export function SystemHeader() {
  return (
    <header className="system-header">
      <span className="wordmark">KEVIN_ARCHIVE_OS</span>
    </header>
  );
}
