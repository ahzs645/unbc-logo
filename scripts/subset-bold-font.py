"""Builds fonts/HelveticaNeueBoldLatin.ttf, the small Bold face embedded in profile-picture exports.

The full HelveticaNeueBold.ttf is ~320KB, which every exported SVG would carry as base64. This
keeps only the characters the bundled Black face covers (ASCII and Latin-1 plus a few extras) and
drops hinting, which rasterizing at export size does not need.

    pip install fonttools
    python3 scripts/subset-bold-font.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

FONTS = Path(__file__).resolve().parent.parent / 'fonts'

coverage = sorted(TTFont(FONTS / 'HelveticaNeueBlack.ttf').getBestCmap())

options = subset.Options()
options.hinting = False
options.name_IDs = ['*']
options.notdef_outline = True

font = TTFont(FONTS / 'HelveticaNeueBold.ttf')
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=coverage)
subsetter.subset(font)
font.save(FONTS / 'HelveticaNeueBoldLatin.ttf')
print(f"{len(font.getBestCmap())} characters → fonts/HelveticaNeueBoldLatin.ttf")
