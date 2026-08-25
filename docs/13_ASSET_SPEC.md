# ASSET SPEC — ILLUSTRATIONS, PHOTOGRAPHY & SCREENSHOTS

> Updated 2026-07-27 (v3). Keff supplied two original character
> illustrations, which **replace the blocking photography**. Photos are
> now optional enrichment rather than a dependency.
>
> Processing tool: `tools/halftone.py` — four presets, runnable.

---

## Status: nothing is blocking

| Slot | Asset | Preset | State |
|---|---|---|---|
| `HERO` | Standing illustration, cropped head + feet, bleeding right | `lineart --fit contain` | **Done** |
| `IMG_002` | Crouching illustration, full figure on a taped plate | `lineart --fit contain --pad 0.02` | **Done** |
| `IMG_004` | Screenshot of the interface | `plate` | **Done** |
| `IMG_005` | Detail crop (footwear), red frame | derived from `IMG_002` | **Done** |
| `IMG_006` | Second project screenshot | `plate` | Optional |
| `IMG_007` | Real photo or workspace shot, for the Profile module | `plate` | Optional |

### Why the illustrations work better here than photos would

They are already flat greyscale with hard black outlines, which is
precisely what ordered dithering was invented for — the mid-grey fills
become screentone and the linework stays crisp. A photograph has to be
crushed with contrast to get there and loses detail on the way. These
needed a contrast multiplier of **1.06**; a phone photo needs ~1.9.

They also solve the thing photos could not: the hero can be cropped
brutally (head off, feet off, bleeding two edges) without it reading as a
bad crop of a real person.

### The `lineart` preset

Line art cannot be treated like a photograph. Crushing contrast either
eats the mid-grey fills or thins the outlines to nothing. So the preset
splits the image by luminance:

- below **0.30** → outline, always solid ink, never dithered
- **0.30 – 0.90** → fill, dithered at the chosen cell size
- above **0.90** → page (transparent for `hero`/`lineart`)

Plus `--fit contain`, which fits the whole subject rather than cropping
it — a full-body figure must not lose its feet to a `cover` crop. Final
cropping happens in CSS, where it can be tuned against the layout.

```bash
python3 tools/halftone.py raw/stand.png src/assets/hero.png \
        --preset lineart --fit contain --width 900 --height 1180
python3 tools/halftone.py raw/sit.png    src/assets/img_002.png \
        --preset lineart --fit contain --pad 0.02 --width 900 --height 900
```

Then tight-crop to the alpha bounding box before shipping, so the hero's
CSS positioning refers to the figure and not to empty padding.

### One flag on the illustrations

Both carry Nike marks — the swoosh, the "NIKE TECH" wordmark, the shield.
**Keff's call, 2026-07-27: keep as-is.** Recorded here once so it is a
decision on the record rather than an oversight: using a third party's
trademark on a public portfolio carries some risk, and it means another
brand's mark appears on a page arguing for yours. If that ever needs
revisiting, painting the marks out and substituting KEVIN_ARCHIVE_OS
chrome (serial on the chest, field tag on the sleeve) is a small edit at
source — the halftone hides most retouching.

---

## If you do add photos later

### Shooting notes

You said phone photos are fine. They are — the processing does the heavy
lifting. What it **cannot** rescue is a busy background or flat, even
lighting. Three things matter, in order:

**1. Plain background, high separation.** A single-colour wall. Stand
about a metre off it so you don't cast a hard shadow onto it. The
halftone step collapses everything to black or paper, so a background
with a bookshelf in it becomes visual noise with no way to remove it.
This matters more than camera quality by a wide margin.

**2. Directional light, not flat light.** One window to your side beats
overhead room light. The whole aesthetic lives in the *streaks* — fold
highlights on fabric, a rim along one edge. Flat lighting dithers to an
even grey field, which is exactly the "wood grain" failure mode the
generated hero went through twice before it was tuned.

**3. Wear something with structure.** Heavy fabric, visible seams,
folds. The reference is a denim tech sheet; creases are the texture. A
smooth t-shirt gives the screen nothing to bite on.

Shoot straight-on, camera at roughly waist height, self-timer on a stack
of books. Don't crop in-camera — shoot loose and crop in processing, the
tool's `cover_crop` biases upward so heads and tops survive.

### Per-slot framing

- **HERO** — the single most important asset. Full-body or waist-down,
  filling the frame vertically, shot from slightly low so you read as
  large. This is the image that bleeds off two edges at ~45% of the
  viewport, so it needs to be interesting at its *edges*, not just its
  centre. Vertical, 3:4 or taller.
- **IMG_002** — chest-up, straight on, neutral expression. It sits at
  3:4 on a taped plate.
- **IMG_005** — get close. Fabric weave, a keyboard, a cable, a hand.
  This one goes inside the red frame, which is the system's way of
  pointing at something, so it should reward being pointed at.

### Screenshots

Capture at 2× device pixel ratio, then let the tool downscale — a 1× grab
dithers into mush. Prefer a screen with strong structure (dense UI,
visible rules) over one that's mostly empty. Full-window, no browser
chrome, no cursor.

---

## Processing

```bash
pip install pillow numpy

python3 tools/halftone.py raw/hero.jpg      src/assets/hero.png       --preset hero
python3 tools/halftone.py raw/portrait.jpg  src/assets/img_002.png    --preset plate
python3 tools/halftone.py raw/project-a.png src/assets/img_004.png    --preset plate
python3 tools/halftone.py raw/detail.jpg    src/assets/img_005.png    --preset detail
```

Presets:

| Preset | Output | Dot cell | Background | Contrast |
|---|---|---|---|---|
| `hero` | 1100×1700 | 2px | **transparent** — so it bleeds without a bounding box | 1.75 |
| `lineart` | 1100×1700 | 2px | **transparent**, outlines thresholded not dithered | 1.06 |
| `plate` | 1440×920 | 1px | Paper White | 1.90 |
| `detail` | 840×840 | 2px | Paper White | 2.10 |

Tuning, in the order to try it:

- Subject vanishing into the background → raise `--contrast` to 2.2–2.6.
- Everything gone solid black → `--bright 0.06`.
- Dots invisible / image looks grey at display size → raise `--cell` to 3.
- Hero showing a faint rectangular edge where it should fade to page →
  lower `--threshold` from `0.86` toward `0.78`.

Always eyeball the output on the **Paper** background (`#E4E4E2`), not on
white. Paper White plate surfaces read differently against it than they
do on a white canvas.

---

## Naming, placement, alt text

- Files: `hero.png`, `img_002.png`, `img_004.png`, … Numbers are stable
  identifiers; they appear in the plate captions (`IMG_004 / BUILD`), so
  renumbering means editing markup.
- Location: `src/assets/plates/`.
- Keep the originals in `raw/`, **git-ignored**. Reprocessing from source
  is routine; you will re-run the tool as the palette or dot size gets
  tuned.

**Alt text is not optional and not decorative-by-default.** The rule from
`05_ACCESSIBILITY.MD` applies:

- `HERO` is `alt=""` + `aria-hidden="true"`. It is atmosphere, and the
  identity block already carries the name and role independently — Home's
  only accessible carriers of that information, since everything else on
  the collage canvas (including the hero) is `aria-hidden`. (Note, added
  2026-08-24, `sdd/drop-intro-hero-placeholder`: Home's own hero slot
  currently holds a reserved, imageless placeholder rather than a photo —
  this asset contract still governs whichever `HERO` plate replaces it.)
- Every other plate needs real alt text describing what the image shows.
  `"Screenshot of the KEVIN_ARCHIVE_OS interface, screenprinted"` — not
  `"project screenshot"`.
- If a plate genuinely has nothing to say, it becomes chrome: `alt=""`
  plus `role="presentation"`. Don't split the difference.

---

## Budget

The v3 proof ships at 174 KB with everything inlined as base64, because
the illustrations compress far better than photographs would — a 1-bit
dither of flat line art is close to a best case for PNG. Photographs at
these sizes land around 700–900 KB total. That is
over budget for a project whose `MASTER_AGENT.md` asks it to "feel
lightweight."

Do this before shipping:

- **Convert to WebP or AVIF.** A 1-bit dither compresses extremely well —
  expect 60–80% off. Keep PNG as the fallback `<source>`.
- **`loading="lazy"` on every plate except the hero and the plate visible
  above the fold.**
- **Serve the hero at two sizes** (`srcset`): full for ≥1180px, and a
  ~500px-wide crop for the mobile banner, which is scaled down hard
  anyway.

Target: **under 250 KB of imagery** on first paint.

---

## Open

1. **Nothing blocks a v1 ship.** All four Home assets are final.
2. The Profile and Project Database modules will each want their own
   plates. The illustrations give a consistent visual voice to build on —
   a third pose (seated at a desk, or a back view) would cover most
   remaining slots. _(Updated 2026-07-31)_ Skills no longer has its own
   page/plates — it's the Home badge field now (`12_COLLAGE_SYSTEM.md`).
   Certificates are the new "own plates" consumer instead, though this
   change deferred a defined asset format/icon treatment for them
   (`Certificate.icon` isn't rendered yet).
3. If real photography ever joins the illustrations, decide first whether
   they coexist or the photos replace them. Mixing an illustrated hero
   with photographic plates reads as unfinished unless the split is
   systematic — e.g. illustrations for the person, photographs only for
   the work.
