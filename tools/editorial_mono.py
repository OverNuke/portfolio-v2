#!/usr/bin/env python3
"""Editorial monochrome — the CONTACT module's portrait plate.

A DELIBERATE EXCEPTION TO docs/13_ASSET_SPEC.md. Every preset in
`tools/halftone.py` dithers, and `image-rendering: pixelated` exists to
protect that dot grid. Neither applies to this plate: the reference for the
contact composition is a photographic fashion cover, not a screenprint, and
dithering the figure fights the quiet the module is built around. If you are
here because the portrait "looks unprocessed" — it is processed, just not
with a screen. Do not run it through halftone.py.

The curve, in order:
  1. desaturate on luminance (not on average — the denim jacket and the
     navy shirt sit at nearly the same average and separate only by luma)
  2. lift the toe ~6% so the jacket does not crush to one black mass
  3. expand contrast 1.62x about the mid
  4. smoothstep, which softens the shoulders the linear expansion clips

Alpha is carried through untouched: the source is already a cutout, and the
composition depends on the figure bleeding onto Paper with no box around it.

    python3 tools/editorial_mono.py \
        src/assets/plates/portrait/hero.png \
        src/assets/plates/portrait/contact-plate.png --width 900
"""

import argparse

import numpy as np
from PIL import Image


def editorial_mono(src: Image.Image, toe: float, contrast: float) -> Image.Image:
    rgba = np.array(src.convert("RGBA")).astype(np.float32)
    alpha = rgba[..., 3]

    lum = (0.2126 * rgba[..., 0] + 0.7152 * rgba[..., 1] + 0.0722 * rgba[..., 2]) / 255.0
    lum = np.clip(lum * (1.0 + toe) + toe * 0.25, 0.0, 1.0)
    lum = np.clip((lum - 0.46) * contrast + 0.50, 0.0, 1.0)
    lum = lum * lum * (3.0 - 2.0 * lum)
    lum = np.clip(lum * 1.03, 0.0, 1.0)

    v = (lum * 255.0).astype(np.uint8)
    return Image.fromarray(np.dstack([v, v, v, alpha.astype(np.uint8)]), "RGBA")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=900)
    ap.add_argument("--toe", type=float, default=0.06)
    ap.add_argument("--contrast", type=float, default=1.62)
    args = ap.parse_args()

    out = editorial_mono(Image.open(args.src), args.toe, args.contrast)
    # LANCZOS, never NEAREST: this plate is downscaled hard by the layout and
    # there is no dot grid here that nearest-neighbour would be preserving.
    out.thumbnail((args.width, args.width), Image.LANCZOS)
    out.save(args.out, optimize=True)
    print(f"{args.out} {out.size}")


if __name__ == "__main__":
    main()
