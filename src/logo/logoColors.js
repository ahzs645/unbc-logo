// Colour variants for the UNBC marks.
//
// The production artwork is authored as a white knockout (40 hard-coded fill="#fff" attributes),
// which only works on a dark ground. Rather than ship three near-identical SVGs that drift apart,
// we rewrite the fills at render time. Fills stay *presentation attributes* rather than moving to
// `currentColor` or CSS, because svg2pdf and standalone <img> rasterization both resolve
// presentation attributes but neither reliably inherits `currentColor` from a host document.

export const BRAND_COLORS = {
  // The primary UNBC green. Matches --brand-green in the door-sign app.
  green: '#035642',
  white: '#ffffff',
  black: '#000000'
}

// Ordered for UI pickers — white first, since that is the artwork's native form.
export const LOGO_VARIANTS = ['white', 'black', 'green']

// Accepts a named variant ('white') or any raw CSS colour ('#c2952d', 'rgb(0 0 0)') and returns
// something safe to drop into a fill attribute. Unknown strings pass through untouched so callers
// can use brand colours we haven't enumerated.
export const resolveColor = (value, fallback = BRAND_COLORS.white) => {
  if (!value) return fallback
  return BRAND_COLORS[value] || value
}

// Relative luminance of a hex colour, used to decide whether a mark reads as light or dark.
// Non-hex colours can't be measured here, so they're treated as dark (the common case for
// custom brand colours) and callers can override the knockout explicitly.
export const isLightColor = (color) => {
  const hex = String(color).trim()
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex)
  if (!match) return false

  const digits = match[1].length === 3
    ? match[1].split('').map((c) => c + c).join('')
    : match[1]

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255)
  const channel = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b) > 0.4
}

// Matches a fill presentation attribute. `fill-rule` is not matched, because `fill` must be
// followed immediately by `="` for this pattern to fire.
const FILL_ATTRIBUTE = /\bfill="([^"]*)"/g

const isWhite = (value) => /^#(fff|ffffff)$/i.test(String(value).trim())

// Repaints every fill in a single-colour mark (the wordmark lockup). Every glyph in the wordmark
// is one flat colour, so a blanket replacement is exactly right here.
export const recolorMark = (markup, color) =>
  markup.replace(FILL_ATTRIBUTE, () => `fill="${color}"`)

// Repaints the multi-colour Alumni crest as a single-colour mark.
//
// The crest is built as a solid body (gold band, green shield, black outlines) with the UNBC
// wordmark and the ALUMNI banner *knocked out* of it in white. Flattening every fill to one
// colour would fill those knockouts back in and produce a solid blob, so the two roles are
// repainted separately: body fills take the target colour, and knockouts take `knockoutColor`.
//
// The knockout default follows the body: a dark crest keeps its white detail, while a light
// (e.g. all-white) crest makes the detail transparent so the backdrop shows through.
export const recolorCrest = (markup, color, knockoutColor) => {
  const knockout = knockoutColor ?? (isLightColor(color) ? 'none' : BRAND_COLORS.white)

  return markup.replace(FILL_ATTRIBUTE, (_match, value) => (
    isWhite(value) ? `fill="${knockout}"` : `fill="${color}"`
  ))
}
