import { Route, Routes, useLocation } from "react-router";
import { CertificationsPage } from "./routes/CertificationsPage";
import { ContactPage } from "./routes/ContactPage";
import { NotFound } from "./routes/NotFound";
import { ProjectsPage } from "./routes/ProjectsPage";
import { ROUTES } from "./routes/routes";
import { Announcer } from "./shell/Announcer";
import { Shell } from "./shell/Shell";
import { ModuleWheel } from "./shell/wheel/ModuleWheel";
import { WheelProvider } from "./shell/wheel/WheelContext";
import { PageLayer } from "./turn/PageLayer";
import { TurnProvider } from "./turn/TurnProvider";
import { useTurn } from "./turn/useTurn";

/**
 * Task 2.5 (sdd/phase2-app-shell), design's file layout ("App.tsx Rewrite
 * — Shell + PageLayer + Announcer + <Routes location>") and "Page-turn
 * Flow": renders inside `TurnProvider`, so it can read `useTurn()`. `App`
 * itself is Router-agnostic — `main.tsx` supplies `<BrowserRouter>`, tests
 * supply `<MemoryRouter>` (same precedent as `TurnProvider.test.tsx`/
 * `Shell.test.tsx`).
 *
 * `NameRevealIntro` (a "intro?" step that used to gate `Shell`'s first
 * render behind whether the initial location was "/") was removed
 * `sdd/drop-intro-hero-placeholder` (2026-08-24) — Home now paints content
 * on the first frame unconditionally, for every route.
 */
function AppShell() {
  const location = useLocation();
  const { turn, displayedPath, layerMounted } = useTurn();

  // Page content is matched against the FROZEN path, not the live one —
  // design's "Page content is matched against a frozen location" note.
  // During a reverse turn `location.pathname` is already "/" (the
  // <Routes> for "/" renders nothing), but the layer is still showing the
  // outgoing page for the duration of the turn; freezing to
  // `displayedPath` keeps PageLayer's title/tag and the routed content in
  // sync with what's actually still painted.
  const contentPath = turn === "reverse" ? displayedPath : location.pathname;
  // Exact match first, then the route whose path is a prefix — /certifications
  // paginates to /certifications/2, and those sheets are the same page, so
  // they must resolve to the same title/tag rather than falling through to
  // "NOT FOUND". The trailing "/" guard keeps /certificationsXYZ from matching.
  const activeRoute =
    ROUTES.find((route) => route.path === contentPath) ??
    ROUTES.find((route) => contentPath.startsWith(`${route.path}/`));

  return (
    <WheelProvider>
      <Shell />
      {layerMounted && (
        <PageLayer title={activeRoute?.title ?? "NOT FOUND"} tag={activeRoute?.tag ?? ""}>
          <Routes location={contentPath}>
            <Route path="/" element={null} />
            <Route path="/certifications" element={<CertificationsPage />} />
          {/* Past the sheet cap the wall paginates rather than densifying, so
              each sheet is a real route and browser back walks the sheets. */}
          <Route path="/certifications/:page" element={<CertificationsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageLayer>
      )}
      {/* A DOM sibling of `Shell`/`PageLayer`, not a child of either —
          `Shell`'s wrapper goes `inert` while a page is open (`useTurn`'s
          `registerShell`), and nothing under that subtree can be the site's
          navigation once it needs to work FROM a routed page too. Fixed
          positioning + `--z-wheel` (tokens.css) put it above both
          regardless of which is currently showing. */}
      <ModuleWheel modules={ROUTES} />
      {/* Announcer/Shell/ModuleWheel are DOM siblings, never nested inside
          one another (design "DOM sibling order & z bands") — `aria-hidden`
          on the inert Shell must never swallow the live-region
          announcement. (Was also true of NameRevealIntro's click-to-dismiss
          escape hatch before its removal, sdd/drop-intro-hero-placeholder,
          2026-08-24.) */}
      <Announcer />
    </WheelProvider>
  );
}

function App() {
  return (
    <TurnProvider>
      <AppShell />
    </TurnProvider>
  );
}

export default App;
