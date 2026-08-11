import { useTurn } from "../turn/useTurn";
import { useTurnKeyboard } from "../turn/useTurnKeyboard";
import { Canvas } from "./collage/Canvas";
import { StatusBar } from "./StatusBar";
import "./shell.css";

/**
 * Task 2.5 (sdd/phase2-app-shell). There is no `routes/Home.tsx` — `Shell`
 * IS Home (design): renders the Frame (StatusBar) and owns
 * `<main id="main-content" tabIndex={-1}>`.
 *
 * `SystemHeader` (the static "KEVIN_ARCHIVE_OS" wordmark band) was removed
 * 2026-08-10 in the editorial-Home refinement pass — it carried no
 * functionality, and the branding motif now lives in `Canvas.tsx`'s
 * `.hm-meta__end` instead. The accessible identity content below is
 * unaffected by that removal: it never lived in SystemHeader.
 *
 * `registerShell` is attached to the OUTER `.shell` wrapper, not `<main>`
 * alone — advisor-flagged: design says "`#main-content` is therefore
 * INSIDE the subtree that goes inert", which only holds if the wrapper
 * (not just main) is what TurnProvider marks inert. Otherwise StatusBar
 * would stay reachable/announced while a page is open. Un-inert
 * on close still happens on the wrapper first, then
 * `getElementById("main-content").focus()` lands inside it — unaffected.
 *
 * The identity (name/role) content lives here UNCONDITIONALLY — this is
 * the safety-critical half of design D6: NameRevealIntro mounts only on an
 * initial "/" load (App.tsx, task 2.5), so whenever it does NOT mount (any
 * other initial route), this accessible name/role content is what the
 * intro's own contract requires the host to independently carry. On a
 * deep-link initial load the shell (and this content) synchronously turns
 * `inert` in the same commit as the forward-home turn starts (design's
 * driver effect) — expected: `PageLayer`'s own heading immediately becomes
 * the live accessible surface. The content still structurally exists in
 * the shell throughout, satisfying the contract.
 *
 * Collage/grid placement (task 3.1) now lives in `Canvas`/`collage.css` —
 * `<main>` wraps `<Canvas>`, which owns the 12x12 grid, the identity plate,
 * and the real NavItem list (task 2.6).
 * All placement (grid-area, rotation, z-index) lives in collage.css
 * (design D5); Shell.tsx itself carries no placement concerns.
 */
export function Shell() {
  const { registerShell } = useTurn();
  useTurnKeyboard();

  return (
    <div className="shell" ref={registerShell}>
      <main id="main-content" tabIndex={-1}>
        <Canvas />
      </main>
      <StatusBar />
    </div>
  );
}
