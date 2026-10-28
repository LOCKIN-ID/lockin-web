#!/usr/bin/env python
"""Extract the LOCK.IN brand assets out of `Lock.in.pdf`.

The deck is a Canva export: every logo is an embedded PNG carried by a soft
mask. Page numbers, image xrefs and crop boxes below are fixed for this one
file and were read out of it (17 pages; three images on page 1, three on
page 9). Nothing here is guessed or redrawn.

Writes into `public/brand/`:
  mark-round.png         the mint disc, square, alpha        (page 9, xref 111)
  lockup-horizontal.png  mark + wordmark, alpha              (page 1, xref 36)
  lockup-vertical.png    the stacked lockup, alpha           (page 9, xref 111)
  wordmark.png           the wordmark band alone, alpha      (page 9, xref 111)
  tagline-shh-gonna.png  "SHH... GONNA", white, alpha        (page 1, xref 37)
  favicon.ico            48px icon cut from the mark
  icon-192.png           192px icon, 12% padding
  icon-512.png           512px icon, 12% padding

Usage: python scripts/extract-brand.py [--pdf Lock.in.pdf] [--out public/brand]
"""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

try:
    import pymupdf  # PyMuPDF
except ImportError:  # pragma: no cover - environment guard
    sys.exit("PyMuPDF is missing. Run: python -m pip install pymupdf")

from PIL import Image

# (page, base image xref, soft mask xref)
MARK = (9, 111, 643)
HORIZONTAL = (1, 36, 483)
TAGLINE = (1, 37, 484)

MARK_CROP = (105, 74, 832, 803)          # the mint disc without its transparent margin
VERTICAL_ALPHA_BBOX = (102, 74, 835, 968)  # lockup + wordmark, tight
WORDMARK_ROWS = (855, 967)               # wordmark band, full width

ICON_PAD = 0.12


def rgba(doc, xref: int, smask: int) -> Image.Image:
    """The base image with its soft mask applied as an alpha channel."""
    base = Image.open(io.BytesIO(doc.extract_image(xref)["image"])).convert("RGB")
    mask = Image.open(io.BytesIO(doc.extract_image(smask)["image"])).convert("L")
    if mask.size != base.size:
        mask = mask.resize(base.size, Image.LANCZOS)
    out = base.convert("RGBA")
    out.putalpha(mask)
    return out


def padded(img: Image.Image, size: int) -> Image.Image:
    """`img` scaled into a square canvas of `size`, `ICON_PAD` of margin on every side."""
    inner = max(1, round(size * (1 - 2 * ICON_PAD)))
    scaled = img.resize((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = (size - inner) // 2
    canvas.paste(scaled, (offset, offset), scaled)
    return canvas


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    print(f"{path.as_posix():<40} {img.width}x{img.height}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", default="Lock.in.pdf")
    parser.add_argument("--out", default="public/brand")
    args = parser.parse_args()

    pdf = Path(args.pdf)
    if not pdf.exists():
        sys.exit(f"not found: {pdf.resolve()}")

    out = Path(args.out)
    doc = pymupdf.open(pdf)

    mark = rgba(doc, MARK[1], MARK[2])
    disc = mark.crop(MARK_CROP)
    save(disc, out / "mark-round.png")

    save(rgba(doc, HORIZONTAL[1], HORIZONTAL[2]), out / "lockup-horizontal.png")
    save(mark.crop(VERTICAL_ALPHA_BBOX), out / "lockup-vertical.png")
    save(mark.crop((0, WORDMARK_ROWS[0], mark.width, WORDMARK_ROWS[1])), out / "wordmark.png")
    save(rgba(doc, TAGLINE[1], TAGLINE[2]), out / "tagline-shh-gonna.png")

    icon = padded(disc, 512)
    save(icon, out / "icon-512.png")
    save(padded(disc, 192), out / "icon-192.png")
    (out / "favicon.ico").parent.mkdir(parents=True, exist_ok=True)
    padded(disc, 48).save(out / "favicon.ico", format="ICO", sizes=[(48, 48)])
    print(f"{(out / 'favicon.ico').as_posix():<40} 48x48 (ICO)")

    doc.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
