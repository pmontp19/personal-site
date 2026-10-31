"""Subset Geist Sans into a preloaded core + an on-demand extended file.

Run by hand (not part of the build); commit the outputs:
  src/assets/fonts/geist-sans-core.woff2
  src/assets/fonts/geist-sans-ext.woff2
  src/styles/geist-sans.css

  pnpm build
  python3 -m venv .venv-fonts && .venv-fonts/bin/pip install fonttools brotli
  .venv-fonts/bin/python scripts/subset-fonts.py
  pnpm build   # picks up the new files

Rerun when: content gains a character outside the core file's unicode-range
(it then pulls in the ext file, and at 1x DPR on macOS ext glyphs land on a
slightly different sub-pixel offset), @fontsource/geist-sans is upgraded, or
CSS applied to Geist starts using an OpenType feature (font-variant-*,
font-feature-settings) or `hyphens: auto`.

The source is the exact file the site served before (fontsource latin 400),
so kept glyphs are byte-for-byte the same outlines. Bold and italics are
synthesized by the browser from this single face; that's unchanged.
"""

import html
import json
import pathlib
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "node_modules/@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff2"
OUT = ROOT / "src/assets/fonts"
CSS = ROOT / "src/styles/geist-sans.css"

# Chrome's defaults for horizontal Latin text, plus tnum: the UA stylesheet sets
# `::marker { font-variant-numeric: tabular-nums }` (ordered-list numbers).
# The prose CSS turns nothing else on; locl only fires for lang tr/ro/az/nl...
# which no page uses.
FEATURES = ["ccmp", "liga", "kern", "mark", "mkmk", "tnum"]

LATIN = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180))  # ASCII, Latin-1, Ext-A

# Core: ASCII + punctuation most pages use + the Catalan alphabet (on nearly
# every post, and kerning doesn't cross font files, so it must live with ASCII).
# U+AD soft hyphen too, so &shy; never pulls in the extended file.
CORE = set(range(0x20, 0x7F)) | {ord(c) for c in "\u00a0\u00ad‘’“”–—…«»·àèéíïòóúüçÀÈÉÍÏÒÓÚÜÇ"}


def used_chars():
    """Every character in the built site plus version-history data (rendered
    client-side by PostVersionViewer). Raw HTML on purpose: a superset is
    cheap, missing a character is a fallback-font glyph."""
    dist = ROOT / "dist"
    if not dist.exists():
        sys.exit("run `pnpm build` first")
    text = "".join(html.unescape(p.read_text()) for p in dist.rglob("*.html"))
    for p in (ROOT / "public/data/git-history").glob("*.json"):
        text += json.dumps(json.loads(p.read_text()), ensure_ascii=False)
    return {ord(c) for c in text}


def ranges(cps):
    out = []
    for c in sorted(cps):
        if out and c == out[-1][1] + 1:
            out[-1][1] = c
        else:
            out.append([c, c])
    return ",".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in out)


def build(cps, path):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = FEATURES
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    opts.desubroutinize = True  # smaller after brotli, same outlines
    # Keep source OS/2 unicode/codepage bits: CoreText reads them and pruned
    # values shift list-marker antialiasing on macOS. Zero bytes either way.
    opts.prune_unicode_ranges = False
    opts.prune_codepage_ranges = False
    # CFF stem hints kept: dropping them saves ~1.7 KB core / ~2.7 KB ext but
    # changes rasterization on every Geist page in Linux Chromium (FreeType).
    opts.hinting = True
    # Keep the source's font-wide bounds (head/CFF FontBBox, hhea extents).
    # Recomputing them per subset shifts glyph rasterization on macOS. Fixed
    # timestamp keeps reruns byte-identical.
    font = TTFont(SRC, recalcBBoxes=False, recalcTimestamp=False)
    # fontsource strips the OFL notice; put it back (OFL 1.1 condition 2).
    name = font["name"]
    name.setName("(C) 2023 Vercel, made in collaboration with basement.studio", 0, 3, 1, 0x409)
    name.setName("This Font Software is licensed under the SIL Open Font License, Version 1.1.", 13, 3, 1, 0x409)
    name.setName("https://openfontlicense.org", 14, 3, 1, 0x409)
    s = subset.Subsetter(opts)
    s.populate(unicodes=cps)
    s.subset(font)
    font.flavor = "woff2"
    font.save(path)
    got = set(TTFont(path).getBestCmap())
    assert got == cps, f"{path.name}: cmap mismatch {sorted(got ^ cps)}"
    return got


def main():
    font_cps = set(TTFont(SRC).getBestCmap())
    used = used_chars()
    keep = font_cps & (LATIN | CORE | used)
    # Every character the content already uses goes in core too: a glyph from
    # the other file starts a new text run, which Chrome snaps to a different
    # sub-pixel offset at 1x (visible shift). Ext is for future content.
    core = keep & (CORE | used)
    ext = keep - core
    OUT.mkdir(parents=True, exist_ok=True)
    build(core, OUT / "geist-sans-core.woff2")
    build(ext, OUT / "geist-sans-ext.woff2")

    face = """@font-face {{
  font-family: "Geist Sans";
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url("../assets/fonts/{file}") format("woff2");
  unicode-range: {range};
}}
"""
    CSS.write_text(
        "/* Generated by scripts/subset-fonts.py. Do not edit; rerun the script. */\n"
        + face.format(file="geist-sans-core.woff2", range=ranges(core))
        + face.format(file="geist-sans-ext.woff2", range=ranges(ext))
    )
    for f in ("geist-sans-core.woff2", "geist-sans-ext.woff2"):
        print(f"{f}: {(OUT / f).stat().st_size} B")
    print(f"core {len(core)} chars, ext {len(ext)} chars, dropped {len(font_cps - keep)}")
    missing = sorted(c for c in used - font_cps if c > 0x7F and chr(c).isprintable())
    print("used but not in source font (system fallback, as before):", "".join(map(chr, missing)))


if __name__ == "__main__":
    main()
