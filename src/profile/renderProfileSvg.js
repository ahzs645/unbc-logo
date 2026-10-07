// Social-media profile picture: the UNBC letters on a green panel over a white caption band.
//
// Like renderLogoSvg() this is plain string-building with no DOM or React, so the same drawing
// feeds the live preview, the raster export, and Node. All geometry is in a 150-unit square —
// the size of the reference avatars this template was measured from — and scales to any output
// size through the viewBox.

import { UNBC_LOGO } from '../assets/markup.js'
import { departmentProfileNames } from '../departments/departmentData.js'
import { recolorMark, resolveColor } from '../logo/logoColors.js'
import { DEPARTMENT_LINE, measureDepartmentText, splitDepartmentText } from '../logo/logoText.js'
import { LOGO_FONT_FAMILY, escapeXml } from '../logo/renderLogoSvg.js'

export const PROFILE_COLORS = {
  // The panel is a soft radial glow: lighter at the centre, deepening toward the corners.
  glow: '#004d3d',
  deep: '#002e24',
  // The caption green, measured from the reference avatars.
  caption: '#063d31',
  band: '#ffffff',
  mark: '#ffffff'
}

// Measured from the 150px reference avatars, and matching the square examples in the Graphics
// Standards Manual (Feb 2020, p. 5: "Student Life", "MBA").
export const PROFILE_LAYOUT = {
  shape: 'square',
  size: 150,
  // The green panel covers the top two thirds; the caption band takes the rest.
  panelHeight: 100,
  // The letters span 107 of the 150 units and are centred in the panel.
  markWidth: 107,
  caption: {
    fontSize: 13,
    // Cap tops sit 9 units into the band, whatever the line count.
    capTop: 109,
    lineHeight: 15,
    maxWidth: 128,
    // Long names shrink rather than spill past the bottom edge, down to this size.
    minFontSize: 8,
    bottomMargin: 6
  }
}

// The circle examples in the Graphics Standards Manual (p. 5: "Wood Engineering", "Graduate
// Programs") are a layout of their own rather than the square cropped: the artwork is the circle,
// the white band starts halfway down, and smaller letters leave room for a larger caption.
// Measured from the manual's embedded 662px artwork, scaled to the same 150 units.
export const PROFILE_CIRCLE_LAYOUT = {
  shape: 'circle',
  size: 150,
  panelHeight: 75,
  markWidth: 64,
  // The letters sit a little below the middle of the green half.
  markCenterY: 40.5,
  caption: {
    fontSize: 17.25,
    lineHeight: 19.75,
    // The caption block (first cap top to last baseline) is centred on this line. The manual's
    // two examples sit 6 units apart (cap tops at 83.8 and 90.2); this splits the difference.
    blockCenter: 102,
    maxWidth: 116,
    minFontSize: 9,
    // Every line keeps this far inside the circle, and below the band's top edge — "Engineering"
    // runs this close to the edge in the manual's own artwork.
    inset: 4,
    bandGap: 6
  }
}

export const PROFILE_LAYOUTS = { square: PROFILE_LAYOUT, circle: PROFILE_CIRCLE_LAYOUT }

export const profileLayout = (shape = 'square') => PROFILE_LAYOUTS[shape] || PROFILE_LAYOUT

/**
 * The name an avatar prints for a department. A unit whose avatar has been checked prints exactly
 * what that avatar does (departmentProfileNames: the Faculty of Science and Engineering's reads
 * "Faculty of Science & Engineering"). Otherwise faculties drop "Faculty of", as UNBC's own
 * faculty avatars mostly do ("Indigenous Studies, Social Sciences and Humanities"), and every
 * other name — "School of Engineering" included — is printed as given.
 */
export const profileCaptionText = (name = '') => {
  const known = departmentProfileNames[name.replace(/\s+/g, ' ').trim()]
  return known ?? name.replace(/^(\s*)Faculty of\s+/i, '$1')
}

// The caption is Helvetica Neue Black — the same face as the lockup's department line and UNBC's
// web display type. Rendered large and downsampled to 150px, Black at 13 units matches the
// reference avatars' caption in width and ink weight; Bold is visibly too light at any size that
// matches the width. (Measuring glyphs rendered *at* 150px misleads: hinting rounds advances.)
//
// HelveticaNeue Black's cap height and descent, as fractions of the em.
const CAP_HEIGHT = 0.7
const DESCENT = 0.17
const FONT_STEP = 0.25

// The four "UNBC" letters are the first four shapes in the lockup artwork; everything after them
// is the "University of Northern British Columbia" subtitle, which is too small to read at avatar
// size. The bounds are the shapes' own coordinates, before the artwork's translate(0, 15).
const LETTER_COUNT = 4
const LETTER_BOUNDS = { x: 0, y: 0, width: 54.97, height: 30.68 }

const SHAPE = /<(?:path|polygon)\b[^>]*\/>/g

export const UNBC_LETTERS = (UNBC_LOGO.inner.match(SHAPE) || []).slice(0, LETTER_COUNT).join('')

const round = (value) => Math.round(value * 100) / 100

// Only "&" opens a caption line. No profile artwork shows an "and" carried down the way the
// lockups do, and in the narrow centred band carrying it often costs a line and a smaller size.
const PROFILE_LINE_OPENERS = ['&']

/**
 * Lays out the caption: wraps it at the largest size (up to the layout's reference size) at
 * which every line fits — across the band and clear of the bottom edge on the square, inside the
 * circle on the circle layout.
 *
 * @returns {{ lines: string[], fontSize: number, lineHeight: number, baseline: number,
 *             shrunk: boolean }}
 */
export const layoutProfileCaption = (text, layout = PROFILE_LAYOUT) => {
  const { caption } = layout
  const circle = layout.shape === 'circle'

  const fit = (fontSize) => {
    // splitDepartmentText measures at the lockup's font size; rescale the wrap width to match.
    const scale = DEPARTMENT_LINE.fontSize / fontSize
    const lines = splitDepartmentText(text, caption.maxWidth * scale, { lineOpeners: PROFILE_LINE_OPENERS })
    const lineHeight = caption.lineHeight * fontSize / caption.fontSize
    const capHeight = fontSize * CAP_HEIGHT
    // The square hangs every caption from the same cap line; the circle centres the block.
    const baseline = circle
      ? caption.blockCenter - ((lines.length - 1) * lineHeight + capHeight) / 2 + capHeight
      : caption.capTop + capHeight
    const result = { lines, fontSize, lineHeight: round(lineHeight), baseline: round(baseline) }
    return { ...result, fits: circle ? fitsCircle(result, layout) : fitsSquare(result, layout) }
  }

  let result = fit(caption.fontSize)
  while (!result.fits && result.fontSize - FONT_STEP >= caption.minFontSize) {
    result = fit(result.fontSize - FONT_STEP)
  }

  const { fits, ...rest } = result
  return { ...rest, shrunk: result.fontSize < caption.fontSize }
}

const fitsSquare = ({ lines, fontSize, lineHeight, baseline }, { size, caption }) =>
  baseline + (lines.length - 1) * lineHeight + fontSize * DESCENT <= size - caption.bottomMargin

const fitsCircle = ({ lines, fontSize, lineHeight, baseline }, { size, panelHeight, caption }) => {
  const top = baseline - fontSize * CAP_HEIGHT
  if (top < panelHeight + caption.bandGap) return false
  return overflowingLines({ lines, fontSize, lineHeight, baseline }, size / 2 - caption.inset, size / 2).length === 0
}

// The lines whose ink strays outside a circle of `radius` centred in the square.
const overflowingLines = ({ lines, fontSize, lineHeight, baseline }, radius, centre) => (
  lines.filter((line, index) => {
    const lineBaseline = baseline + index * lineHeight
    // The line's lowest ink is the corner that strays furthest from the centre.
    const lowest = Math.max(
      Math.abs(lineBaseline - fontSize * CAP_HEIGHT - centre),
      Math.abs(lineBaseline + fontSize * DESCENT - centre)
    )
    if (lowest >= radius) return true
    const halfChord = Math.sqrt(radius ** 2 - lowest ** 2)
    const halfWidth = measureDepartmentText(line) * fontSize / DEPARTMENT_LINE.fontSize / 2
    return halfWidth > halfChord
  })
)

/**
 * Most platforms crop avatars to a circle, which cuts into the square layout's lower corners.
 * Returns the caption lines whose ink would fall outside that circle, so a UI can warn before
 * the platform silently clips them. The circle layout is drawn to fit, so it reports none.
 */
export const findCircleCropOverflow = (text, layout = PROFILE_LAYOUT) => {
  if (layout.shape === 'circle') return []
  return overflowingLines(layoutProfileCaption(text, layout), layout.size / 2, layout.size / 2)
}

const panelFill = (background, layout) => {
  if (!background || background === 'gradient') {
    const { size } = layout
    // The glow is brightest behind the letters.
    const cy = layout.markCenterY ?? layout.panelHeight / 2
    return {
      defs: `<radialGradient id="unbc-profile-glow" gradientUnits="userSpaceOnUse"` +
        ` cx="${size / 2}" cy="${cy}" r="80">` +
        `<stop offset="0" stop-color="${PROFILE_COLORS.glow}"/>` +
        `<stop offset="1" stop-color="${PROFILE_COLORS.deep}"/>` +
        '</radialGradient>',
      fill: 'url(#unbc-profile-glow)'
    }
  }
  return { defs: '', fill: resolveColor(background) }
}

/**
 * A social-media profile picture as a standalone SVG document string: the square, or the circle
 * layout (transparent outside the circle).
 *
 * @param {object} options
 * @param {string} [options.departmentText] Caption under the panel; wraps and shrinks to fit,
 *                                          and honours explicit newlines.
 * @param {string} [options.shape]          'square' (default) or 'circle'.
 * @param {string} [options.background]     'gradient' (the default green glow) or any colour.
 * @param {string} [options.markColor]      Colour of the UNBC letters.
 * @param {string} [options.bandColor]      Colour of the caption band.
 * @param {string} [options.textColor]      Colour of the caption.
 * @param {number} [options.pixelWidth]     Sets width/height attributes at this pixel size.
 * @param {string} [options.fontCss]        CSS injected into <defs>, for embedding @font-face.
 * @returns {string} A complete <svg> document.
 */
export const renderProfileSvg = ({
  departmentText = '',
  shape = 'square',
  background = 'gradient',
  markColor = PROFILE_COLORS.mark,
  bandColor = PROFILE_COLORS.band,
  textColor = PROFILE_COLORS.caption,
  pixelWidth,
  fontCss,
  fontFamily = LOGO_FONT_FAMILY,
  title
} = {}) => {
  const layout = profileLayout(shape)
  const { size, panelHeight, markWidth } = layout
  const circle = layout.shape === 'circle'
  const panel = panelFill(background, layout)

  const scale = markWidth / LETTER_BOUNDS.width
  const markCenterY = layout.markCenterY ?? panelHeight / 2
  const markX = (size - markWidth) / 2 - LETTER_BOUNDS.x * scale
  const markY = markCenterY - LETTER_BOUNDS.height * scale / 2 - LETTER_BOUNDS.y * scale
  const letters = recolorMark(UNBC_LETTERS, resolveColor(markColor))

  const { lines, fontSize, lineHeight, baseline } = layoutProfileCaption(departmentText, layout)
  const fill = resolveColor(textColor)
  const captionMarkup = lines.map((line, index) => (
    `<text x="${size / 2}" y="${round(baseline + index * lineHeight)}" text-anchor="middle"` +
    ` font-family="${escapeXml(fontFamily)}" font-size="${fontSize}"` +
    ` font-weight="${DEPARTMENT_LINE.fontWeight}" fill="${fill}">${escapeXml(line)}</text>`
  )).join('')

  const dimensions = pixelWidth ? ` width="${pixelWidth}" height="${pixelWidth}"` : ''
  const clip = circle
    ? `<clipPath id="unbc-profile-circle"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></clipPath>`
    : ''
  const defs = panel.defs + clip + (fontCss ? `<style>${fontCss}</style>` : '')
  const label = title ?? ['UNBC', ...lines].join(' ')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"${dimensions}>` +
    `<title>${escapeXml(label)}</title>` +
    (defs ? `<defs>${defs}</defs>` : '') +
    (circle ? '<g clip-path="url(#unbc-profile-circle)">' : '') +
    `<rect width="${size}" height="${size}" fill="${resolveColor(bandColor)}"/>` +
    `<rect width="${size}" height="${panelHeight}" fill="${panel.fill}"/>` +
    (circle ? '</g>' : '') +
    `<g transform="translate(${round(markX)} ${round(markY)}) scale(${round(scale * 1000) / 1000})">` +
    letters + '</g>' +
    captionMarkup +
    '</svg>'
}
