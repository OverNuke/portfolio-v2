# NameRevealIntro

Standalone extraction of the cinematic name-reveal intro from `portfolio/app/_components/ui/CinematicIntro.tsx`. Self-contained — no dependency on the host project's Tailwind config or theme tokens; styling is plain CSS driven by custom properties.

**Themed 2026-07-27** to match this portfolio's design system (see `docs/02_DESIGN_SYSTEM.MD`): Paper background, Ink headline, Gray secondary text, Field Olive on the corner marks (the same accent used for the reticle-corner / field-tag motifs elsewhere in the system — this component's `CornerMarks` predates that doc but is functionally the same idea). One deliberate exception: the font stack is untouched — Georgia / system-ui / SFMono stay as-is rather than switching to the docs' recommended Archivo / Space Mono, by explicit choice.

## Install

```bash
npm install gsap motion
```

React 18+ required (uses hooks).

## Usage

```tsx
import { NameRevealIntro } from "./name-reveal-intro";

export default function Page() {
  return (
    <>
      <NameRevealIntro />
      <main id="main-content">{/* page content */}</main>
    </>
  );
}
```

Use a different name/word sequence:

```tsx
import { NameRevealIntro, type Beat } from "./name-reveal-intro";

const beats: Beat[] = [
  { label: "JANE", treatment: "display", tag: "I" },
  { label: "DOE", treatment: "settled", tag: "II" },
];

<NameRevealIntro beats={beats} caption="Jane Doe" />;
```

## Behavior

- Plays once per browser session (`sessionStorage`), skips automatically if `prefers-reduced-motion` is set or the viewport is under 640px wide.
- Dismissible early via click, or **any** keypress — `Escape`, `Enter`, `Space`, or `Tab` — while it's showing.
- Locks page scroll while active, restores it on dismiss, and moves focus to `#main-content` (configurable via `focusTargetId`).

## Accessibility

**Fixed 2026-07-27.** The overlay is fully `aria-hidden` and never receives
focus — previously it was only partially hidden (corner marks and captions
were `aria-hidden`, but the beat headings like "KEVIN" were not), which left
screen reader users with an incoherent, half-exposed animation instead of
either a real equivalent or a clean skip. A rapidly auto-cycling text
sequence has no good screen-reader translation, so it's now treated as
purely decorative:

- The whole overlay carries `aria-hidden="true"` — nothing inside it is
  ever announced.
- It's never focused. `Tab` was added to the dismiss-key set specifically
  so a keyboard user can't end up tabbing toward content hidden behind an
  overlay they can't perceive — the very first keypress ends it.
- **This means the host page's real content is the only accessible source
  of this information.** Whatever `focusTargetId` points to (`#main-content`
  by default) must contain the person's name, role, etc. in real semantic
  markup on its own — this component is a decorative bonus for sighted
  users, not a substitute for that content existing.

## Theming

Current defaults (in `NameRevealIntro.css`) match `docs/02_DESIGN_SYSTEM.MD`:

```css
:root {
  --nri-bg: #e4e4e2;      /* Paper */
  --nri-fg: #111111;      /* Ink */
  --nri-fg-dim: #635d54;  /* Gray — eyebrow/caption meta text */
  --nri-accent: #4f5a3c;  /* Field Olive — corner marks / skip hint */
  --nri-font-display: "Georgia", "Times New Roman", serif;
  --nri-font-sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  --nri-font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
```

Override any of these from a parent scope to re-theme without touching the component. All values were re-checked against WCAG AA at the sizes they're used at (see `docs/05_ACCESSIBILITY.MD`) — if you override a color, re-check contrast rather than assuming it still passes.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `beats` | `Beat[]` | Kevin Sebastián Frías García sequence | Sequence of beats to play |
| `beatMs` | `number` | `760` | Duration of each beat, ms |
| `finalHoldSeconds` | `number` | `1.4` | Extra hold on the last beat before auto-dismiss |
| `eyebrow` | `string` | `"— portfolio —"` | Caption above the settled beat's label |
| `caption` | `string` | — | Caption below the settled beat's label |
| `persistKey` | `string \| null` | `"intro:played"` | `sessionStorage` key; pass `null` to always replay |
| `minWidthToPlay` | `number` | `640` | Viewport width below which the intro is skipped |
| `onComplete` | `() => void` | — | Called once the intro dismisses |
| `focusTargetId` | `string` | `"main-content"` | Element focused after dismiss |
