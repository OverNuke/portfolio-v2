import { useState } from "react";
import { Route, Routes, useLocation } from "react-router";
import { NameRevealIntro } from "./components/name-reveal-intro";
import { ContactPage } from "./routes/ContactPage";
import { NotFound } from "./routes/NotFound";
import { ProfilePage } from "./routes/ProfilePage";
import { ProjectsPage } from "./routes/ProjectsPage";
import { ROUTES } from "./routes/routes";
import { SkillsPage } from "./routes/SkillsPage";
import { Announcer } from "./shell/Announcer";
import { Shell } from "./shell/Shell";
import { PageLayer } from "./turn/PageLayer";
import { TurnProvider } from "./turn/TurnProvider";
import { useTurn } from "./turn/useTurn";

/**
 * Task 2.5 (sdd/phase2-app-shell), design's file layout ("App.tsx Rewrite
 * — intro? + Shell + PageLayer + Announcer + <Routes location>") and
 * "Page-turn Flow": renders inside `TurnProvider`, so it can read
 * `useTurn()`. `App` itself is Router-agnostic — `main.tsx` supplies
 * `<BrowserRouter>`, tests supply `<MemoryRouter>` (same precedent as
 * `TurnProvider.test.tsx`/`Shell.test.tsx`).
 */
function AppShell() {
  const location = useLocation();
  const { turn, displayedPath, layerMounted } = useTurn();

  // D6: NameRevealIntro mounts only if the INITIAL location is "/",
  // decided ONCE at mount — never re-evaluated on navigation. A lazy
  // useState initializer runs exactly once (first render), which is what
  // "decided once at mount" requires; reading it directly from `location`
  // on every render would instead re-gate on every route change.
  const [showIntro] = useState(() => location.pathname === "/");

  // Page content is matched against the FROZEN path, not the live one —
  // design's "Page content is matched against a frozen location" note.
  // During a reverse turn `location.pathname` is already "/" (the
  // <Routes> for "/" renders nothing), but the layer is still showing the
  // outgoing page for the duration of the turn; freezing to
  // `displayedPath` keeps PageLayer's title/tag and the routed content in
  // sync with what's actually still painted.
  const contentPath = turn === "reverse" ? displayedPath : location.pathname;
  const activeRoute = ROUTES.find((route) => route.path === contentPath);

  return (
    <>
      {showIntro && <NameRevealIntro caption="Full-Stack Developer" />}
      <Shell />
      {layerMounted && (
        <PageLayer title={activeRoute?.title ?? "NOT FOUND"} tag={activeRoute?.tag ?? ""}>
          <Routes location={contentPath}>
            <Route path="/" element={null} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageLayer>
      )}
      {/* Announcer/Shell/intro are DOM siblings, never nested inside one
          another (design "DOM sibling order & z bands") — `aria-hidden` on
          the inert Shell must never swallow the live-region announcement,
          and `inert` on the Shell must never disable the intro's
          click-to-dismiss escape hatch. */}
      <Announcer />
    </>
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
