// Social-media profile picture: the UNBC letters on a green panel over a white caption band.
//
// Like renderLogoSvg() this is plain string-building with no DOM or React, so the same drawing
// feeds the live preview, the raster export, and Node. All geometry is in a 150-unit square —
// the size of the reference avatars this template was measured from — and scales to any output
// size through the viewBox.

import { UNBC_LOGO } from '../assets/markup.js'
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

// Measured from the 150px reference avatars.
export const PROFILE_LAYOUT = {
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

/**
 * Lays out the caption: wraps it at the largest size (up to the reference 13 units) at which
 * every line fits across the band and the last line clears the bottom edge.
 *
 * @returns {{ lines: string[], fontSize: number, lineHeight: number, baseline: number,
 *             shrunk: boolean }}
 */
export const layoutProfileCaption = (text, layout = PROFILE_LAYOUT) => {
  const { caption, size } = layout
  const floor = size - caption.bottomMargin

  const fit = (fontSize) => {
    // splitDepartmentText measures at the lockup's font size; rescale the wrap width to match.
    const scale = DEPARTMENT_LINE.fontSize / fontSize
    const lines = splitDepartmentText(text, caption.maxWidth * scale)
    const lineHeight = caption.lineHeight * fontSize / caption.fontSize
    const baseline = caption.capTop + fontSize * CAP_HEIGHT
    const bottom = baseline + (lines.length - 1) * lineHeight + fontSize * DESCENT
    return { lines, fontSize, lineHeight: round(lineHeight), baseline: round(baseline), bottom }
  }

  let result = fit(caption.fontSize)
  while (result.bottom > floor && result.fontSize - FONT_STEP >= caption.minFontSize) {
    result = fit(result.fontSize - FONT_STEP)
  }

  const { bottom, ...rest } = result
  return { ...rest, shrunk: result.fontSize < caption.fontSize }
}

/**
 * Most platforms crop avatars to a circle, which cuts into the caption band's lower corners.
 * Returns the caption lines whose ink would fall outside that circle, so a UI can warn before
 * the platform silently clips them.
 */
export const findCircleCropOverflow = (text, layout = PROFILE_LAYOUT) => {
  const { lines, fontSize, lineHeight, baseline } = layoutProfileCaption(text, layout)
  const radius = layout.size / 2

  return lines.filter((line, index) => {
    const lineBaseline = baseline + index * lineHeight
    // The line's lowest ink is the corner that strays furthest from the centre.
    const lowest = Math.max(
      Math.abs(lineBaseline - fontSize * CAP_HEIGHT - radius),
      Math.abs(lineBaseline + fontSize * DESCENT - radius)
    )
    if (lowest >= radius) return true
    const halfChord = Math.sqrt(radius ** 2 - lowest ** 2)
    const halfWidth = measureDepartmentText(line) * fontSize / DEPARTMENT_LINE.fontSize / 2
    return halfWidth > halfChord
  })
}

const panelFill = (background) => {
  if (!background || background === 'gradient') {
    const { size, panelHeight } = PROFILE_LAYOUT
    return {
      defs: `<radialGradient id="unbc-profile-glow" gradientUnits="userSpaceOnUse"` +
        ` cx="${size / 2}" cy="${panelHeight / 2}" r="80">` +
        `<stop offset="0" stop-color="${PROFILE_COLORS.glow}"/>` +
        `<stop offset="1" stop-color="${PROFILE_COLORS.deep}"/>` +
        '</radialGradient>',
      fill: 'url(#unbc-profile-glow)'
    }
  }
  return { defs: '', fill: resolveColor(background) }
}

/**
 * A square social-media profile picture as a standalone SVG document string.
 *
 * @param {object} options
 * @param {string} [options.departmentText] Caption under the panel; wraps and shrinks to fit,
 *                                          and honours explicit newlines.
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
  background = 'gradient',
  markColor = PROFILE_COLORS.mark,
  bandColor = PROFILE_COLORS.band,
  textColor = PROFILE_COLORS.caption,
  pixelWidth,
  fontCss,
  fontFamily = LOGO_FONT_FAMILY,
  title
} = {}) => {
  const { size, panelHeight, markWidth } = PROFILE_LAYOUT
  const panel = panelFill(background)

  const scale = markWidth / LETTER_BOUNDS.width
  const markX = (size - markWidth) / 2 - LETTER_BOUNDS.x * scale
  const markY = (panelHeight - LETTER_BOUNDS.height * scale) / 2 - LETTER_BOUNDS.y * scale
  const letters = recolorMark(UNBC_LETTERS, resolveColor(markColor))

  const { lines, fontSize, lineHeight, baseline } = layoutProfileCaption(departmentText)
  const fill = resolveColor(textColor)
  const captionMarkup = lines.map((line, index) => (
    `<text x="${size / 2}" y="${round(baseline + index * lineHeight)}" text-anchor="middle"` +
    ` font-family="${escapeXml(fontFamily)}" font-size="${fontSize}"` +
    ` font-weight="${DEPARTMENT_LINE.fontWeight}" fill="${fill}">${escapeXml(line)}</text>`
  )).join('')

  const dimensions = pixelWidth ? ` width="${pixelWidth}" height="${pixelWidth}"` : ''
  const defs = panel.defs + (fontCss ? `<style>${fontCss}</style>` : '')
  const label = title ?? ['UNBC', ...lines].join(' ')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"${dimensions}>` +
    `<title>${escapeXml(label)}</title>` +
    (defs ? `<defs>${defs}</defs>` : '') +
    `<rect width="${size}" height="${size}" fill="${resolveColor(bandColor)}"/>` +
    `<rect width="${size}" height="${panelHeight}" fill="${panel.fill}"/>` +
    `<g transform="translate(${round(markX)} ${round(markY)}) scale(${round(scale * 1000) / 1000})">` +
    letters + '</g>' +
    captionMarkup +
    '</svg>'
}
