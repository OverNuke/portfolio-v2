# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

**Corrected 2026-09-18**: the editorial redesign (`b702da2`, "Redesign with Claude Design") replaced the old shell/collage architecture described below. `src/App.tsx` now composes `BrowserRouter` → `I18nProvider` → `TurnProvider` → an `AppShell` that always renders `home={<Home />}` (`src/home/Home.tsx` + `ModuleNav.tsx`) plus a `PageLayer` overlay for the active route (`Routes`: `/profile` → `ProfileSection`, `/certifications` → `DistinctionSection`, `/projects` → `ProjectsSection`, `/contact` → `ContactDock`, all under `src/sections/{profile,distinction,projects,contact}/` — page components no longer live under `src/routes/`, which now holds only the path/label registry `registry.ts`). Page-turn navigation (`src/turn/`) still drives focus and `inert` on route change.

All four routed pages render **real, shipped content** (not placeholder) — Profile (chambers + canvas ink-blooms), Distinction (power-diagram colony + lightbox), Projects (3 real projects with photos/tags/repo links), Contact (3 channels: email/GitHub/LinkedIn, dock physics). The old collage-grid Home (`Shell`, `Canvas.tsx`, `collage.css`, `skills-collage.css`, `SkillsCollage.tsx`, `collageSeeds.ts`, `useCollageSeed.ts`, `components/skill-badge/`) and the `ModuleWheel` nav are **fully deleted from disk**, not merely unreferenced — confirmed via repo-wide grep, zero matches outside CSS/token files.

The design reference for this redesign is `docs/design-canvas/` (10 `.dc.html` Claude Canvas design-tool exports — reference-only, never built directly — unpacked from the root `Claude Desing/Sketch manga hero section rebuild.zip`), under an SDD change called `sdd/rebuild-src-from-claude-design`. That change has **no tracked proposal/design/tasks artifacts in-repo** — only dated amendments inline in `docs/02_DESIGN_SYSTEM.MD` / `docs/03_UX_ARCHITECTURE.MD` and commit messages — a discoverability gap worth fixing if the change continues.

What's still actually missing: a `Cell Fusion` section (present in `docs/design-canvas/` but with no route, nav slot, or registry entry — a net-new feature, not a fidelity gap); warm-paper (`#F6F4EA`) and dark-mode token adoption, both already documented in `docs/02_DESIGN_SYSTEM.MD` as intentionally sequenced/deferred; roadmap Phase 4 (textures, animations, advanced effects); and the broader roadmap Phase 5 accessibility audit (the automated collage audit — `scripts/audit.mjs` — and CI now cover the page-turn slice of this; a full a11y audit pass is still open). There is no `/skills` route yet — Skills is scoped as Wave 4 of `sdd/design-canvas-reconcile-v2`.

Locked conventions enforced at the config level, not just by doc convention:
- `tailwind.config.ts` overrides `theme.borderRadius` to all `0px` (rounded-* utilities are inert) and maps `theme.extend.colors` to the CSS custom properties in `src/styles/tokens.css` — that file is the single source of truth for the palette in `docs/02_DESIGN_SYSTEM.MD`; never hardcode a hex anywhere else.
- `eslint.config.js` runs `typescript-eslint` + `react-hooks` + `jsx-a11y` (accessibility linting is non-negotiable per `src/MASTER_AGENT.md`'s "Accessibility is Mandatory" principle).
- `no-empty` has `allowEmptyCatch: true` — the codebase has intentional silent-catch around `sessionStorage` access (throws in Safari private mode); that's correct behavior, not a bug.

The one pre-existing exception outside the JS toolchain is `tools/halftone.py`, a working, standalone image-processing script (see below).

## Commands

```bash
pnpm install         # first time / after pulling dependency changes
pnpm dev             # Vite dev server
pnpm build           # tsc -b && vite build (production build)
pnpm preview         # preview the production build locally
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint . (add lint:fix to auto-fix)
pnpm format          # prettier --write . (add format:check to only check)
pnpm test            # vitest run (add test:watch for watch mode)
pnpm run audit:collage  # scripts/audit.mjs — occlusion/target-size/clipped-text audit at 1440/1280/1100/390px (always `pnpm run`, never bare `pnpm audit` — that's pnpm's own dependency-audit subcommand)
pnpm e2e             # pnpm build && playwright test — real browser specs under e2e/

python3 tools/halftone.py in.jpg out.png --preset hero    # or: plate, detail, lineart
```

This project uses **pnpm** exclusively — `package.json`'s `preinstall` script blocks `npm install`/`yarn install`. Don't reintroduce `package-lock.json` or a second lockfile.

`halftone.py` converts a photo/illustration into a dithered "archive plate" asset (Bayer 8x8 ordered dither + contrast crush toward ink/paper). Requires `pillow` and `numpy`. Presets differ in output size, dot cell size, and whether the background is transparent (`hero`/`lineart`) or paper-white (`plate`/`detail`). Run `python3 tools/halftone.py --help` for all flags.

`.github/workflows/ci.yml` runs typecheck/lint/test/build/audit/e2e on push and pull request.

## Agent session hygiene

- Ad-hoc verification scripts, probe `.mjs` files, and screenshots belong in the session scratchpad directory. Never the repo root. Committed tooling lives in `scripts/` or `tools/` and is referenced from `package.json`.
- Never delete an untracked file without explicit user confirmation — git cannot recover it. Move it to `_quarantine/` (gitignored) and let the user empty that directory.
- `.claude/`, `.atl/`, `.impeccable/` are gitignored tool state. `claude/` (no leading dot) is NOT — it is a spec location cited by live code (`src/components/project-sheet/project-sheet.css` line 3). Never sweep it.
- `_quarantine/` is a holding pen, not storage. If it is non-empty, ask the user before adding to it.

## What this project is

**KEVIN_ARCHIVE_OS** — a developer portfolio deliberately built as *not* a website: a single-viewport "digital operating system" with a HUD/FUI–neo-industrial–Japanese-streetwear-editorial visual identity (fashion technical sheets, scanned magazines, game character-select screens). Full mission and five guiding principles (Identity over Trends, Controlled Chaos, Functional Instrumentation, Information Density, Accessibility is Mandatory) are in `src/MASTER_AGENT.md` — read that file first; it's the constitution every other doc answers to.

## Doc-driven architecture

This project's "architecture" currently lives in numbered spec docs under `docs/`, not in code. Each doc is a single source of truth for its domain — don't restate their content elsewhere, reference them:

| Doc | Owns |
|---|---|
| `00_PROJECT_VISION.MD` | Concept, anti-patterns, single-viewport interaction model |
| `01_ART_DIRECTION.MD` | Visual keywords, layout philosophy, material language |
| `02_DESIGN_SYSTEM.MD` | Color palette (hex values + contrast ratios), typography, border rules |
| `03_UX_ARCHITECTURE.MD` | Dashboard layout, modules, **page-turn navigation model** (see below) |
| `04_COMPONENT_RULES.MD` | Panel/Project-card component contracts |
| `05_ACCESSIBILITY.MD` | WCAG 2.2 AA contrast pairs, keyboard mapping, decorative-animation pattern |
| `06_FRONTEND_STACK.MD` | React + Vite + TS + Tailwind + Framer Motion; explicitly no Next.js |
| `07_ANIMATION_GUIDELINES.md` | Motion philosophy (mechanical, not playful) |
| `08_AGENT_ROLES.md` | Which sub-agent reads which doc |
| `09_IMPLEMENTATION_ROADMAP.md` | Phase order (setup → shell → modules → polish → a11y audit) |
| `11_HANDOFF_HOME.md` | Full implementation spec for the Home screen (layout grid, states, breakpoints) — has a runnable HTML mockup in `docs/home.design-proof-v3.html` |
| `12_COLLAGE_SYSTEM.md` | **Supersedes** the shell-grid layout in `11_HANDOFF_HOME.md` — Home is an overlap/collage grid over a bleeding halftone hero, not a dashboard grid. Read this before touching Home layout. |
| `13_ASSET_SPEC.md` | Asset dimensions/format contract that `tools/halftone.py` presets implement |

When docs conflict, the later dated correction wins (docs are annotated inline with the date and reason for each change, e.g. the paper color and Field Olive accent additions on 2026-07-27) — check for "Updated"/"SUPERSEDED" notes at the top of a doc before trusting a section further down.

### Non-negotiable conflict order (from `src/MASTER_AGENT.md`)

When two concerns disagree, resolve in this order: **Accessibility → Project Vision → Architecture → Developer Experience → Implementation Speed.** Never trade the first for the last.

## Key architectural decisions to know before touching UI code

- **No scrolling at the shell level.** Home is a fixed single-viewport dashboard (`100dvh`, not `100vh`). Opening a module/project/page is a real state change ("page turn"), not scroll — each page gets its own route (`/`, `/profile`, `/certifications`, `/projects`, `/contact`) so browser back/forward and deep-links work. A page's *own content* may scroll internally; the shell never does. Below 768px the no-scroll rule is released per WCAG 1.4.10 reflow (accessibility beats vision, per the conflict order above).
- **Page-turn direction is right-to-left (manga order)**, a Keff-approved deliberate choice — but this is purely a spatial/navigational convention, not a document-direction change. Never set `dir="rtl"`. Body text, tab order, and form fields stay normal LTR. Only transition wipes and directional chrome (back icons, arrow ordering) mirror.
- **Keyboard mapping follows the visual turn direction, not Western convention**: Left Arrow = forward/open, Right Arrow = back/close, Escape = back/close. Tab/Shift+Tab is never remapped. Every arrow-key action must also be reachable via Tab+Enter (arrow keys are a shortcut layer, not the only path).
- **Color/contrast values are law, not suggestions.** `02_DESIGN_SYSTEM.MD` and `05_ACCESSIBILITY.MD` list exact hex values with measured contrast ratios (e.g. Gray was changed from `#777777` to `#635D54` because the old value failed AA at 3.59:1). Don't reintroduce a rejected value; don't invent new accent colors without contrast-checking and documenting the ratio the way existing entries do.
- **`border-radius: 0` everywhere**, enforced globally once Tailwind lands — no rounded corners anywhere in the system.
- **Decorative auto-playing animations must be fully `aria-hidden`, never partially.** `docs/05_ACCESSIBILITY.MD`'s "Decorative / Auto-Playing Animations" section is the reference for this pattern (inlined there 2026-08-24, `sdd/drop-intro-hero-placeholder`, after the pattern's original reference implementation — `src/components/name-reveal-intro/`, last held at commit `12463dd` — was deleted): a rapidly auto-cycling animation has no coherent screen-reader translation, so it's marked fully decorative, never receives focus, and dismisses on *any* keypress — while the host page's real content must independently carry the same information (name/role) in accessible markup. Follow this same pattern for any future intro/loading/section-sting animation.

## Existing code

`src/components/name-reveal-intro/` (the cinematic name/role reveal that used to gate Home's first render at `/`) was removed `sdd/drop-intro-hero-placeholder` (2026-08-24) once the editorial redesign no longer had a slot for it. `motion`/`gsap` were its sole importers and remain installed but currently unused pending a separate follow-up change; the accessibility pattern it demonstrated is now documented directly in `docs/05_ACCESSIBILITY.MD` rather than in the component's own README.

## Asset pipeline

`tools/halftone.py` turns source photos/illustrations into the dithered "plate" images used throughout the archive aesthetic. It matters architecturally because the dither *is* the image (rendered with `image-rendering: pixelated` in CSS, per the script's own docstring) — don't run additional image compression/resizing on its output that would blur the dot grid. Presets (`hero`, `plate`, `detail`, `lineart`) encode the exact dimensions and treatment `13_ASSET_SPEC.md` specifies.
