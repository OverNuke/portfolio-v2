import { BrowserRouter } from "react-router";

// Phase 0 placeholder — replaced by TurnProvider/AppShell/PageLayer
// composition in Phase 1 (task 1.14/1.19). Exists only so main.tsx has a
// valid entry and the toolchain gate (0.8) can go green.
export default function App() {
  return (
    <BrowserRouter>
      <div data-testid="app-shell-placeholder">KEVIN_ARCHIVE_OS</div>
    </BrowserRouter>
  );
}
