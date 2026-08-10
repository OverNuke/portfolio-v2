# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters and hiring managers evaluating Kevin Sebastián Frías García for entry-level ("Jr.") software developer roles and internships. They arrive to quickly assess technical skill, personality, and design sensitivity, and to find a fast path to contact.

The site is not positioned as a general dev-community showcase — the confirmed primary job is getting Kevin hired, not impressing other engineers as a craft demo (though the craft itself is part of the pitch to that primary audience).

## Product Purpose

A developer portfolio for Kevin, built as an interactive "digital operating system" artifact rather than a conventional scrolling website. Success means a recruiter leaves thinking "this doesn't feel like another portfolio" / "I feel like I'm exploring someone's digital workspace" (per `src/MASTER_AGENT.md`'s stated success criteria), remembers the candidate, and can find and use the contact path.

## Positioning

Distinguishes itself from template/SaaS-style developer portfolios (generic hero sections, rounded cards, glassmorphism, infinite scroll) by committing to a specific, sustained visual world — HUD/FUI tech-manual editorial, neo-industrial design, Japanese visual culture, game character-select screens — applied as a real interaction model (single-viewport "OS," page-turn navigation, modules instead of scroll sections), not just surface styling. The mechanism a generic portfolio template could not copy: content is framed as inspectable technical/garment specification data (measurement points, spec plates, compliance tags) rather than conventional bio copy.

## Operating Context

- Single-viewport application; no traditional scrolling at the shell level (a page's own content may scroll internally). Navigation happens via page-turn transitions between routes (`/`, `/profile`, `/projects`, `/skills`, `/contact`), not scroll sections.
- Page-turn direction is right-to-left (manga order) as a spatial/navigational convention only — document direction stays LTR throughout.
- Below 768px, the no-scroll rule is deliberately released per WCAG 1.4.10 reflow.

## Capabilities and Constraints

- Stack: React + Vite + TypeScript + Tailwind CSS, React Router, Motion (framer-motion successor) + GSAP for animation. No Next.js. pnpm-only (blocks npm/yarn install). Confirmed via existing codebase — not an open decision.
- `border-radius: 0` enforced globally — no rounded corners anywhere in the system.
- Color palette and typography are locked to the values in `docs/02_DESIGN_SYSTEM.MD` / `src/styles/tokens.css` — not an area for invented colors without a documented, contrast-checked rationale.
- Keyboard mapping follows the visual turn direction (Left = forward/open, Right = back/close, Escape = close), not Western convention; Tab/Shift+Tab is never remapped, and every arrow-key action must also be reachable via Tab+Enter.
- Decorative auto-playing/rapid-cycling animations must be fully `aria-hidden` (never partially) and must never hold focus; when such an animation is the only place information appears, the same information must exist in real accessible markup elsewhere on the page.
- WCAG 2.2 AA is a hard requirement, not aspirational — see Accessibility & Inclusion below.

## Brand Commitments

- Project/system name: **KEVIN_ARCHIVE_OS**. Candidate name as it appears in-product: Kevin Sebastián Frías García. Style/reference code used throughout as a running motif: **KSFG-001**.
- Visual identity is committed, not open for casual reinterpretation: HUD/FUI, neo-industrial, Japanese streetwear/editorial, analog-digital hybrid, "Swiss-grid precision," garment-tech-sheet framing. Full direction lives in `docs/01_ART_DIRECTION.MD` and `docs/02_DESIGN_SYSTEM.MD` — those documents override generic design defaults.
- Explicit anti-patterns (from `docs/00_PROJECT_VISION.MD` / `src/MASTER_AGENT.md`): standard hero sections, infinite scrolling, SaaS layouts, rounded cards, generic gradients, glassmorphism, centered landing pages, kicker/eyebrow labels above headings, hero-metric templates.
- Animation philosophy is "mechanical, not playful" — terminal-boot, panel-transition, scanner-effect register; no elastic/bouncy/particle motion (`docs/07_ANIMATION_GUIDELINES.md`).

## Evidence on Hand

- **Certifications** (real, confirmed): ANFECA Academic Recognition (2025), Nota Laudatoria (2025), EXAVER Language Proficiency — U. Veracruzana (2022), English — Anglo Mexicano (2021), TOEFL — SEP (2018), CONISOFT workshop (2025).
- **Shipped projects** (real, with screenshot assets under `src/assets/projects/`): AcopiaTech, Barbershop, an Odoo-based project.
- **Personal/location facts**: origin Coatzacoalcos, MX; based Mexico, UTC-6; stated response time < 48h; open to junior roles and internships.
- **No résumé/CV file, LinkedIn/GitHub URL, or named target companies exist in the repo** — confirmed absent; do not fabricate these or state them as facts in future work.
- **No real photography of Kevin exists anywhere in the repo** (confirmed via project-wide search). The Profile page's figure/portrait is currently hand-drawn placeholder SVG art (dithered/halftone style via the existing `#dth`/`#dth2` SVG patterns, or eventually `tools/halftone.py` output). Confirmed: real photography is a **planned future asset**, not the permanent look — placeholder art should stay sized/structured (fixed aspect ratios, documented bounding boxes) so a real photo can drop in later without restructuring markup.

## Product Principles

1. **Identity over trends** — never adopt a popular web pattern just because it's popular; the OS/archive metaphor is load-bearing, not decorative.
2. **The candidate is the product** — content is deliberately framed as inspectable spec/measurement data about Kevin (a "tech pack" for a person), not conventional bio prose.
3. **Controlled chaos, not literal chaos** — asymmetry, overlap, and density are curated design choices bounded by an underlying system (grid, rotation caps, token-based spacing), never arbitrary.
4. **Functional instrumentation over decoration** — visual weight comes from structure (borders, frames, labels, technical annotations) communicating real information, not ornament.
5. **Accessibility is never traded away** — when it conflicts with any other principle (vision, architecture, DX, speed), accessibility wins; see the conflict order in `CLAUDE.md` / `src/MASTER_AGENT.md`.

## Accessibility & Inclusion

WCAG 2.2 AA is mandatory, not best-effort (`docs/05_ACCESSIBILITY.MD`, `src/MASTER_AGENT.md` principle 5). Confirmed durable requirements: documented contrast ratios for every color pairing (no reverting to rejected values like the old `#777777` gray), full keyboard operability with the project's own left/right/escape mapping plus unremapped Tab traversal, semantic HTML, and reduced-motion support (`prefers-reduced-motion` respected throughout, no flashing effects). Decorative/auto-cycling animation must never be the sole carrier of information — see Capabilities and Constraints above.
