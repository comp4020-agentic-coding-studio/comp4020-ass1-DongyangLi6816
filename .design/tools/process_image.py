#!/usr/bin/env python3
"""Recolour source artwork into the site's red-figure palette.

Two modes, because the sources are two different kinds of thing:

  line  -- for engravings (Flaxman/Piroli): pure black line on paper. We
           auto-level, invert, and map ink density onto a ground->figure
           ramp. Downsampling happens BEFORE the ramp so line weight
           survives as tonal density instead of disappearing to sub-pixel.

  tone  -- for oil paintings, frescoes and vase photographs: a continuous
           luminance duotone through the same ramp, so wildly different
           sources still read as one set.

The ramp is the only thing the two modes share, and it is what makes a
1793 engraving and a Pompeian fresco sit next to each other without a
seam.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageOps

# The site's palette. Ground is the black slip of an Attic pot; figure is
# fired clay warming to the parchment highlight.
SLIP = (0x1C, 0x13, 0x0D)
CLAY = (0xC1, 0x63, 0x2C)
PARCHMENT = (0xF2, 0xE4, 0xC4)

# Inverse: for the light theme / print variant.
SLIP_LIGHT = (0xEF, 0xE4, 0xCD)
CLAY_DARK = (0x8A, 0x3D, 0x18)
INK = (0x24, 0x1A, 0x12)

RAMPS = {
    # name: (ground, mid, highlight)
    "redfigure": (SLIP, CLAY, PARCHMENT),
    "blackfigure": (SLIP_LIGHT, CLAY_DARK, INK),
}


def build_lut(ground, mid, high):
    """256-entry RGB lookup table interpolating ground -> mid -> high."""
    lut = []
    for channel in range(3):
        col = []
        for i in range(256):
            t = i / 255.0
            if t <= 0.5:
                u = t / 0.5
                v = ground[channel] + (mid[channel] - ground[channel]) * u
            else:
                u = (t - 0.5) / 0.5
                v = mid[channel] + (high[channel] - mid[channel]) * u
            col.append(int(round(v)))
        lut.extend(col)
    return lut


def trim(im: Image.Image, tol: int = 12) -> Image.Image:
    """Crop uniform border (scanned engravings carry a lot of dead paper)."""
    grey = im.convert("L")
    # Border colour is whatever sits in the corner.
    bg = grey.getpixel((0, 0))
    mask = grey.point(lambda p: 255 if abs(p - bg) > tol else 0)
    box = mask.getbbox()
    return im.crop(box) if box else im


def process(
    src: Path,
    dst: Path,
    mode: str,
    ramp: str,
    width: int,
    do_trim: bool,
    autocontrast: float,
) -> tuple[int, int]:
    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        flat = Image.new("RGB", im.size, (255, 255, 255))
        flat.paste(im, mask=im.split()[-1])
        im = flat
    im = im.convert("RGB")

    if do_trim:
        im = trim(im)

    grey = ImageOps.grayscale(im)
    if autocontrast > 0:
        grey = ImageOps.autocontrast(grey, cutoff=autocontrast)

    # Downsample first so hairline strokes become anti-aliased tone rather
    # than vanishing between sample points.
    if width and grey.width > width:
        h = round(grey.height * width / grey.width)
        grey = grey.resize((width, h), Image.LANCZOS)

    if mode == "line":
        # Paper is light, ink is dark. Invert so ink drives the ramp.
        grey = ImageOps.invert(grey)
    # mode == "tone": luminance drives the ramp directly.

    ground, mid, high = RAMPS[ramp]
    out = grey.convert("RGB")
    out = out.point(build_lut(ground, mid, high))

    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.suffix.lower() == ".webp":
        out.save(dst, "WEBP", quality=88, method=6)
    else:
        out.save(dst)
    return out.size


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("src", type=Path)
    ap.add_argument("dst", type=Path)
    ap.add_argument("--mode", choices=("line", "tone"), default="line")
    ap.add_argument("--ramp", choices=tuple(RAMPS), default="redfigure")
    ap.add_argument("--width", type=int, default=1000)
    ap.add_argument("--no-trim", action="store_true")
    ap.add_argument("--autocontrast", type=float, default=1.0)
    a = ap.parse_args()

    size = process(
        a.src, a.dst, a.mode, a.ramp, a.width, not a.no_trim, a.autocontrast
    )
    print(f"{a.dst}  {size[0]}x{size[1]}  {a.dst.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
