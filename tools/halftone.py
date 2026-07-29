#!/usr/bin/env python3
"""
halftone.py — turn a photo into a KEVIN_ARCHIVE_OS plate image.

This is the processing step that makes a casual phone photo read as archive
material. It does three things, in order:

  1. Crops to the aspect ratio the plate expects.
  2. Pushes contrast so the subject collapses toward solid ink and the
     background toward paper. This is where "underground" comes from — a
     mid-grey photograph will never look printed.
  3. Applies a Bayer 8x8 ordered dither at a chosen cell size. The dot
     screen IS the image; that is why the CSS uses image-rendering:
     pixelated on the hero.

Usage
-----
    python3 halftone.py in.jpg out.png --preset hero
    python3 halftone.py in.jpg out.png --preset plate --contrast 2.1
    python3 halftone.py in.jpg out.png --preset detail --cell 3

Presets
-------
    hero     1100x1700  cell 2  transparent background  (photo, bleeding figure)
    lineart  1100x1700  cell 2  transparent background  (illustrations, vector art)
    plate   1440x 920  cell 1  paper-white background  (photo / screenshot)
    detail   840x 840  cell 2  paper-white background  (red-framed crop)

Requires: pillow, numpy   (pip install pillow numpy)
"""
import argparse, sys
import numpy as np
from PIL import Image, ImageOps

PAPER_WHITE = (0xF6, 0xF6, 0xF4)
INK = (0x11, 0x11, 0x11)

BAYER8 = np.array([
    [ 0, 32,  8, 40,  2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44,  4, 36, 14, 46,  6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
    [ 3, 35, 11, 43,  1, 33,  9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47,  7, 39, 13, 45,  5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
], np.float32)

PRESETS = {
    "hero":   dict(size=(1100, 1700), cell=2, alpha=True,  contrast=1.75, bright=-0.06),
    "plate":  dict(size=(1440,  920), cell=1, alpha=False, contrast=1.90, bright=-0.04),
    "detail": dict(size=( 840,  840), cell=2, alpha=False, contrast=2.10, bright=-0.02),
    # Line art (illustrations, vector exports, comic panels) needs a
    # different treatment from photographs. A photo can be crushed with
    # contrast; line art cannot, because crushing either eats the mid-grey
    # fills or thins the outlines to nothing. So outlines are thresholded to
    # solid ink and only the fills are dithered. This is how screentone
    # works on real comic art, and it's why these illustrations screenprint
    # better than a phone photo would.
    "lineart": dict(size=(1100, 1700), cell=2, alpha=True, contrast=1.06,
                    bright=0.0, lineart=True),
}

# lineart thresholds, in normalised luminance
LINE_MAX = 0.30     # darker than this is outline -> always solid ink
PAGE_MIN = 0.90     # lighter than this is background -> always page


def bayer_field(h, w):
    return np.tile((BAYER8 + 0.5) / 64.0, (h // 8 + 1, w // 8 + 1))[:h, :w]


def contain_pad(img, size, pad=0.0):
    """Fit the whole subject inside the box; never crops. pad = 0..0.4 margin."""
    tw, th = size
    iw, ih = round(tw * (1 - 2 * pad)), round(th * (1 - 2 * pad))
    scale = min(iw / img.width, ih / img.height)
    img = img.resize((max(1, round(img.width * scale)),
                      max(1, round(img.height * scale))), Image.LANCZOS)
    out = Image.new("RGB", size, (255, 255, 255))
    out.paste(img, ((tw - img.width) // 2, (th - img.height) // 2))
    return out


def cover_crop(img, size):
    """Fill the target box, cropping the overflow. Never distorts."""
    tw, th = size
    scale = max(tw / img.width, th / img.height)
    img = img.resize((max(1, round(img.width * scale)),
                      max(1, round(img.height * scale))), Image.LANCZOS)
    left = (img.width - tw) // 2
    top = (img.height - th) // 3          # bias upward: heads/tops matter more
    return img.crop((left, top, left + tw, top + th))


def halftone(path_in, path_out, size, cell, alpha, contrast, bright, threshold,
             lineart=False, fit="cover", pad=0.0):
    img = Image.open(path_in)
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        flat = Image.new("RGBA", img.size, (255, 255, 255, 255))
        flat.alpha_composite(img)          # transparent -> page, not black
        img = flat.convert("RGB")
    else:
        img = img.convert("RGB")
    img = contain_pad(img, size, pad) if fit == "contain" else cover_crop(img, size)

    # Dither at 1/cell resolution, then nearest-upscale, so each dot is
    # `cell` device pixels wide and survives being scaled in the browser.
    dw, dh = max(1, size[0] // cell), max(1, size[1] // cell)
    small = img.resize((dw, dh), Image.LANCZOS)

    g = np.asarray(ImageOps.grayscale(small)).astype(np.float32) / 255.0
    g = np.clip((g - 0.5) * contrast + 0.5 + bright, 0.0, 1.0)
    ink_mask = g < bayer_field(dh, dw)
    if lineart:
        ink_mask = (ink_mask | (g < LINE_MAX)) & (g < PAGE_MIN)

    if alpha:
        out = np.zeros((dh, dw, 4), np.uint8)
        out[..., 0:3] = INK
        # Anything brighter than `threshold` becomes page, not paper-white:
        # that is what lets the hero bleed without a visible bounding box.
        keep = (g < (PAGE_MIN if lineart else threshold))
        out[..., 3] = (ink_mask & keep).astype(np.uint8) * 255
        im = Image.fromarray(out, "RGBA")
    else:
        out = np.where(ink_mask[..., None], np.array(INK, np.uint8),
                                            np.array(PAPER_WHITE, np.uint8))
        im = Image.fromarray(out.astype(np.uint8), "RGB")

    im = im.resize(size, Image.NEAREST)
    im.save(path_out, optimize=True)
    return im.size


def main():
    ap = argparse.ArgumentParser(description="Screenprint a photo for KEVIN_ARCHIVE_OS.")
    ap.add_argument("input"); ap.add_argument("output")
    ap.add_argument("--preset", choices=sorted(PRESETS), default="plate")
    ap.add_argument("--cell", type=int, help="dot size in px (overrides preset)")
    ap.add_argument("--contrast", type=float, help="1.0 = none; 1.8-2.2 typical")
    ap.add_argument("--bright", type=float, help="-0.1 darker .. +0.1 lighter")
    ap.add_argument("--width", type=int); ap.add_argument("--height", type=int)
    ap.add_argument("--threshold", type=float, default=0.86,
                    help="hero preset only: above this the pixel becomes page")
    ap.add_argument("--fit", choices=["cover", "contain"], default="cover",
                    help="cover crops to fill; contain fits the whole subject in")
    ap.add_argument("--pad", type=float, default=0.0,
                    help="with --fit contain: margin as a fraction, 0..0.4")
    a = ap.parse_args()

    cfg = dict(PRESETS[a.preset])
    if a.cell:     cfg["cell"] = a.cell
    if a.contrast: cfg["contrast"] = a.contrast
    if a.bright is not None: cfg["bright"] = a.bright
    if a.width and a.height: cfg["size"] = (a.width, a.height)

    size = halftone(a.input, a.output, cfg["size"], cfg["cell"], cfg["alpha"],
                    cfg["contrast"], cfg["bright"], a.threshold,
                    lineart=cfg.get("lineart", False), fit=a.fit, pad=a.pad)
    print(f"{a.output}  {size[0]}x{size[1]}  preset={a.preset} "
          f"cell={cfg['cell']} contrast={cfg['contrast']}")


if __name__ == "__main__":
    sys.exit(main())
