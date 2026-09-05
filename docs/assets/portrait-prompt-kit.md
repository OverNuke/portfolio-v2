# Portrait prompt kit — monochrome ink-sketch series

Text-to-image prompt kit for the three-portrait ink-sketch set used as a portrait
asset in KEVIN_ARCHIVE_OS. Companion to `docs/13_ASSET_SPEC.md` — this covers the
*generation* prompt, not the post-processing (that's `tools/halftone.py`).

Generate the three portraits as **separate images**. Consistency across the set
comes from text you repeat verbatim, not from the reference image alone. Each
prompt = **STYLE BLOCK** + **CHARACTER LOCK** + **one POSE BLOCK**. Paste the
first two identically every time.

---

## STYLE BLOCK — identical in all three prompts

> Black ink portrait study on plain white paper. Loose, confident hand-drawn
> linework — the look of a single-sitting sketchbook gesture study, not a
> cleaned-up inked panel. Thin, searching contour lines with deliberate weight
> variation: heavier on the jawline, the shadow side of the face, the hairline,
> and where forms turn away from the light; lighter and broken elsewhere.
> Shading is sparse and economical — short directional hatching only in the
> deepest pockets (under the jaw, the neck hollow, the eye sockets, inside the
> hair mass), never a full crosshatched rendering, never a grey wash. Hair drawn
> as directional strokes following its mass. Pure black ink only — no grey, no
> screentone, no marker fill. Plain white background: no environment, no props,
> no cast shadow, no border. Figure cropped at the collarbone. Candid editorial
> feeling — the subject is caught mid-thought, never posing, gaze never meeting
> the viewer.

## CHARACTER LOCK — fill the brackets once from the photo, then identical every time

> Same man in every image. [age range]. [face shape — oval / square jaw /
> round]. [hair: length, texture, part — e.g. short dark hair, slightly
> tousled]. [hairline]. [eyebrows: thickness / shape]. [nose: e.g. straight,
> medium length]. [facial hair: clean-shaven / light stubble / beard].
> [glasses: none / thin frames]. [neck and shoulder build]. [clothing at the
> crop — e.g. plain crew-neck tee]. Keep these proportions and this facial
> structure identical across the series: eye spacing, nose length, jaw width,
> ear position. Only the head angle and expression change between images.

## POSE BLOCK 1 — "top-left"

> Three-quarter view, face turned ~30° off-camera. Chin dropped slightly toward
> the chest. Eyes lowered, looking down and away off-frame. Calm and serious —
> mouth relaxed and closed, no smile, brow smooth. Caught mid-thought.

## POSE BLOCK 2 — "top-right"

> Near-profile, head turned roughly three-quarters to the side — only the far
> cheekbone and brow visible. Gaze off-frame in the direction the head faces. A
> faint, closed-mouth knowing smile, a slight lift at one corner — the warmest
> expression in the set. Chin level.

## POSE BLOCK 3 — "bottom"

> Three-quarter view, head bowed noticeably forward and down. Eyes cast down and
> to the side as if reading a screen just below the frame. Brow lightly furrowed
> in concentration, a small crease between the eyebrows. Mouth neutral, faintly
> tense. The most closed, downward posture of the three.

## NEGATIVE — for tools that take one; phrasing also works for MJ `--no`

> color, colored ink, greyscale wash, watercolor, painterly rendering, digital
> painting, cel shading, full crosshatch rendering, screentone, halftone dots,
> photograph, photorealistic, 3D render, background, scenery, furniture, props,
> text, lettering, signature, watermark, panel border, speech bubble, frame,
> multiple heads, collage, distorted anatomy, symmetrical posed headshot, eye
> contact with camera, wide grin

---

## Running it for consistency

- **Repeat STYLE + CHARACTER LOCK verbatim** in all three prompts. That text —
  not the seed — carries identity across different angles.
- **Midjourney:** `--cref <photo-url> --cw 40` (keeps the face, lets hair/cloth
  follow the prompt), plus the *same* `--sref <style-ref-url> --sw 80` on all
  three to lock the drawing hand. `--style raw --ar 4:5 --no color, background,
  text`.
- **Nano Banana / gpt-image / Gemini:** attach the photo as identity reference
  and the style reference on every call; paste the blocks; explicitly ask it to
  "match the line quality and artist's hand of the style reference."
- **Stable Diffusion / Flux:** identity via IPAdapter-Face or PuLID on the
  photo; STYLE + POSE in positive, the NEGATIVE block in negative; lock model +
  sampler.
- **Any tool:** generate 3–4 of each pose, then pick the *set that looks like
  siblings*, not the best single image.

## Calibration levers

1. **Denser shading** — for heavy crosshatch (Sienkiewicz / editorial
   pen-and-ink), replace the STYLE BLOCK shading sentence with: *"Form is built
   with layered directional crosshatching across every shadow plane — the neck,
   under the jaw, the shadow side of the face and the hair carry dense hatch
   lines."*
2. **More overtly manga** — add to CHARACTER LOCK: *"simplified manga facial
   features: clean eye shapes, minimal nose, expressive eyebrows."*

## Reference notes

- Style anchor is the loose contour-line gesture-study look (Kim Jung Gi
  lineage), ~90% pure line with sparse hatching — this kit matches that, not the
  denser crosshatch the term "crosshatch shading" implies. Lever 1 above pushes
  it denser if wanted.
- A full-colour brush-pen illustration was passed alongside as a reference; it
  contradicts "pure black ink, no colour" and is deliberately not used as a
  style input.
