"""Builds the kit's Helvetica Neue LT Pro faces from the font package in fonts/source/.

fonts/source/ is the Helvetica Neue LT Pro package as supplied (every weight and width). The kit
uses four of its faces — 55 Roman, 56 Italic, 75 Bold and 95 Black, the cut UNBC's own documents
are set in — and the copies in the package each lack a table:

  * Roman, Italic and Bold have no kerning. Their letters have exactly the advance widths of the
    older Helvetica Neue faces in fonts/, and Linotype's kerning is the same in both releases
    where they overlap, so the older faces' kerning pairs are copied in, limited to characters
    both fonts have.
  * Black has no ligature table. Its fi and fl glyphs are there (U+FB01, U+FB02); a 'liga'
    feature for them is added, as the other three faces already have.

It writes fonts/HelveticaNeueLTPro-*.otf. The same faces are built the same way for the UNBCDoor
sign generator (its tools/build_brand_fonts.py), so a lockup sets identically in both. Run from
the repository root (needs fontTools: `pip install fonttools`):

    python3 scripts/build-fonts.py
"""

from pathlib import Path

from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / 'fonts'
SOURCE = FONTS / 'source'

# (file in the package, output name, older face to take kerning from or None)
FACES = [
    ('HelveticaNeueLTProRoman.otf', 'HelveticaNeueLTPro-Roman', 'HelveticaNeueRoman.otf'),
    ('HelveticaNeueLTProIt.otf', 'HelveticaNeueLTPro-Italic', 'HelveticaNeueItalic.ttf'),
    ('HelveticaNeueLTProBd.otf', 'HelveticaNeueLTPro-Bold', 'HelveticaNeueBold.otf'),
    ('HelveticaNeueLTProBlk.otf', 'HelveticaNeueLTPro-Black', None),
]


def char_names(font):
    """Glyph name → its first code point."""
    names = {}
    for code, name in sorted(font.getBestCmap().items()):
        names.setdefault(name, code)
    return names


def kerning_pairs(font):
    """Every non-zero kerning pair in a font, as {(left char, right char): x-advance}."""
    chars = char_names(font)
    pairs = {}

    def add(left, right, value):
        if value and left in chars and right in chars:
            pairs.setdefault((chars[left], chars[right]), value)

    if 'GPOS' in font:
        table = font['GPOS'].table
        lookups = {index for record in table.FeatureList.FeatureRecord if record.FeatureTag == 'kern'
                   for index in record.Feature.LookupListIndex}
        order = font.getGlyphOrder()
        for index in sorted(lookups):
            lookup = table.LookupList.Lookup[index]
            for sub in lookup.SubTable:
                if lookup.LookupType == 9:
                    sub = sub.ExtSubTable
                if getattr(sub, 'LookupType', lookup.LookupType) != 2:
                    continue
                if sub.Format == 1:
                    for left, pair_set in zip(sub.Coverage.glyphs, sub.PairSet):
                        for record in pair_set.PairValueRecord:
                            add(left, record.SecondGlyph, getattr(record.Value1, 'XAdvance', 0))
                else:
                    first, second = sub.ClassDef1.classDefs, sub.ClassDef2.classDefs
                    for left in sub.Coverage.glyphs:
                        row = sub.Class1Record[first.get(left, 0)].Class2Record
                        for right in order:
                            add(left, right, getattr(row[second.get(right, 0)].Value1, 'XAdvance', 0))
    if 'kern' in font:
        for subtable in font['kern'].kernTables:
            for (left, right), value in subtable.kernTable.items():
                add(left, right, value)
    return pairs


def add_kerning(font, donor):
    cmap = font.getBestCmap()
    lines = [
        f'  pos {cmap[left]} {cmap[right]} {value};'
        for (left, right), value in sorted(kerning_pairs(donor).items())
        if left in cmap and right in cmap
    ]
    addOpenTypeFeaturesFromString(font, 'languagesystem DFLT dflt;\nlanguagesystem latn dflt;\n'
                                  'feature kern {\n' + '\n'.join(lines) + '\n} kern;\n', tables=['GPOS'])
    return len(lines)


def add_ligatures(font):
    cmap = font.getBestCmap()
    rules = [f'  sub {cmap[ord(first)]} {cmap[ord(second)]} by {cmap[code]};'
             for first, second, code in [('f', 'i', 0xFB01), ('f', 'l', 0xFB02)] if code in cmap]
    addOpenTypeFeaturesFromString(font, 'languagesystem DFLT dflt;\nlanguagesystem latn dflt;\n'
                                  'feature liga {\n' + '\n'.join(rules) + '\n} liga;\n', tables=['GSUB'])
    return len(rules)


def main():
    for source, output, donor in FACES:
        font = TTFont(SOURCE / source)
        if donor:
            added = add_kerning(font, TTFont(FONTS / donor))
            print(f'{output}: {added} kerning pairs from {donor}')
        if 'GSUB' not in font:
            print(f'{output}: {add_ligatures(font)} ligatures')
        font.save(FONTS / f'{output}.otf')


if __name__ == '__main__':
    main()
