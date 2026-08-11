# Design exploration — three directions for Home

Standalone proofs. Open any `index.html` straight off disk; nothing needs a
build step, a server, or a network connection.

```
docs/design-exploration/
  direction-01-editorial/index.html    Editorial Minimal
  direction-02-monochrome/index.html   Monochrome Digital
  direction-03-experimental/index.html Experimental Art Direction

  fonts.css          the app's four faces, self-hosted
  option-wheel.css   React Bits <OptionWheel /> CSS, unchanged in structure
  option-wheel.js    vanilla port of the same component (see the file header)
  sections.js        module content lifted from routes.ts + data.ts
  assets/            the seated portrait, and the two @fontsource families
  HANDOFF.md         the implementation spec
```

## Why these are HTML and not React

Same reason as every other proof in `docs/`: `src/` stays untouched until a
direction is chosen. Nothing here imports from the app, nothing here is
imported by the app, and deleting the folder removes every trace of the
exploration. The one thing the proofs reach into `src/` for is the two
self-hosted LT font files, read-only, via `../../src/assets/fonts/`.

The port back is small and is described in `HANDOFF.md`.

## Try it

- **Space** — next module. Primary interaction on desktop.
- **↑ ↓ ← →** — step, once the wheel has focus (Tab to it).
- **Click / drag / scroll** — all still work, inherited from the component.
- **Touch** — a small ruled square in the corner, coarse pointers only.
- **Reduced motion** — turn it on at the OS level and reload: no easing, no
  blur, instant swaps.

## What is deliberately absent

The olive and oxblood accents. The Index plate. The profile plate. The badge
field. The 12×12 collage. Every card. These are compositions about a
photograph, a name, and a very small amount of type.
