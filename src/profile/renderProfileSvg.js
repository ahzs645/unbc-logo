// Social-media profile picture: the UNBC letters on a green panel over a white caption band.
//
// Like renderLogoSvg() this is plain string-building with no DOM or React, so the same drawing
// feeds the live preview, the raster export, and Node. All geometry is in a 150-unit square —
// the size of the reference avatars this template was measured from — and scales to any output
// size through the viewBox.

import { UNBC_LOGO } from '../assets/markup.js'
import { departmentProfileNames } from '../departments/departmentData.js'
import { findLockedProfile } from './lockedProfiles.js'
import { recolorMark, resolveColor } from '../logo/logoColors.js'
import { DEPARTMENT_LINE, measureDepartmentText, wrapDepartmentText } from '../logo/logoText.js'
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

// Measured from UNBC's own avatars (overlaid at 662px): the panel and letters from the reference
// avatars and the Graphics Standards Manual (Feb 2020, p. 5), the caption from the department
// avatars — Sustainability, Northwest, Bookstore and the manual's MBA (one line), School of
// Engineering (two), and Geography, Earth & Environmental Sciences (three).
export const PROFILE_LAYOUT = {
  shape: 'square',
  size: 150,
  // The green panel covers the top two thirds; the caption band takes the rest.
  panelHeight: 100,
  // The letters span 107 of the 150 units and are centred in the panel.
  markWidth: 107,
  caption: {
    // The avatars set the caption by how many lines it takes: one line large and centred in the
    // band, two a size down, three smaller and tighter. `center` is where the block — first cap
    // top to last baseline — sits; `leading` is the line spacing as a multiple of the size.
    styles: [
      // A single line shrinks no further than the smallest one-line avatar (the manual's 13.15
      // "Student Life") before taking two lines instead.
      { fontSize: 14.6, minFontSize: 13, leading: 1.2, center: 123.6 },
      // Two lines likewise shrink a little before a third line is added.
      { fontSize: 12.35, minFontSize: 11, leading: 1.2065, center: 120.6 },
      { fontSize: 10.65, leading: 1.075, center: 121 }
    ],
    maxWidth: 128,
    // Longer names shrink in the three-line style, down to this size, to stay in the band.
    minFontSize: 8,
    topGap: 4,
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

const SIZE_STEP = 0.05

// Square captions break evenly rather than filling each line in turn — the way UNBC's avatars
// break ("Conference & / Event Services", "Geography, Earth / & Environmental / Sciences"). The
// circle's lines run between curved edges, and its only references are two words, so it keeps
// filling each line in turn, with "&" opening a line. wrapDepartmentText measures at the lockup's
// font size, so the width is rescaled to match.
const wrapCaption = (text, fontSize, maxWidth, shape = 'square', minLines = 1) =>
  wrapDepartmentText(
    text,
    maxWidth * DEPARTMENT_LINE.fontSize / fontSize,
    shape === 'circle' ? { lineOpeners: ['&'] } : { balance: true, minLines }
  )

const widest = (lines, fontSize) =>
  Math.max(0, ...lines.map((line) => measureDepartmentText(line) * fontSize / DEPARTMENT_LINE.fontSize))

// Places a block of lines so it is centred on `center`, measured from the first cap top to the
// last baseline.
const placeBlock = (lines, fontSize, lineHeight, center) => {
  const capHeight = fontSize * CAP_HEIGHT
  const capTop = center - ((lines.length - 1) * lineHeight + capHeight) / 2
  const baseline = capTop + capHeight
  return {
    lines,
    fontSize,
    lineHeight: round(lineHeight),
    baseline: round(baseline),
    top: capTop,
    bottom: baseline + (lines.length - 1) * lineHeight + fontSize * DESCENT
  }
}

// The square tries each style in turn: one line, from its size down to its floor; then two lines,
// likewise; then three or more, shrinking until the block clears the band's edges. The first that
// fits wins, so a caption takes another line rather than squeeze far below its style's size.
const layoutSquareCaption = (text, { size, panelHeight, caption }) => {
  const { styles, maxWidth } = caption
  const [one, two, three] = styles
  if (!text.trim()) return { ...placeBlock([], one.fontSize, one.fontSize * one.leading, one.center), style: one }
  const steps = (from, to) => {
    const sizes = []
    for (let step = 0; round(from - step * SIZE_STEP) >= to; step++) sizes.push(round(from - step * SIZE_STEP))
    return sizes
  }
  const attempts = [
    ...steps(one.fontSize, one.minFontSize).map((fontSize) => ({ fontSize, lines: 1 })),
    ...steps(two.fontSize, two.minFontSize).map((fontSize) => ({ fontSize, lines: 2 })),
    ...steps(three.fontSize, caption.minFontSize).map((fontSize) => ({ fontSize, lines: 3 })),
    // Last resort, for a single word too long for the band: one line, shrinking past its floor.
    ...steps(one.minFontSize, caption.minFontSize).map((fontSize) => ({ fontSize, lines: 1 }))
  ]

  let smallest = null
  for (const attempt of attempts) {
    const lines = wrapCaption(text, attempt.fontSize, maxWidth, 'square', attempt.lines)
    // One and two lines must come out at exactly that count; three means three or more.
    if (attempt.lines < 3 ? lines.length !== attempt.lines : lines.length < 3 && !/\n/.test(text)) continue
    const style = styles[Math.min(lines.length, styles.length) - 1]
    const placed = { ...placeBlock(lines, attempt.fontSize, attempt.fontSize * style.leading, style.center), style }
    smallest = placed
    const fitsBand = placed.top >= panelHeight + caption.topGap && placed.bottom <= size - caption.bottomMargin
    if (fitsBand && widest(lines, attempt.fontSize) <= maxWidth) return placed
  }

  // Nothing fits (a single word too long for the band): the fewest lines at the smallest size.
  if (smallest) return smallest
  const lines = wrapCaption(text, caption.minFontSize, maxWidth)
  const style = styles[Math.min(Math.max(lines.length, 1), styles.length) - 1]
  return { ...placeBlock(lines, caption.minFontSize, caption.minFontSize * style.leading, style.center), style }
}

/**
 * Lays out the caption: breaks it evenly at the largest size its layout allows — on the square,
 * the size for its line count, shrinking only to clear the band's edges; on the circle, the size
 * at which every line sits inside the circle.
 *
 * A caption measured from one of UNBC's own avatars (lockedProfiles.js) is drawn exactly as
 * measured instead; pass `{ locked: false }` for the defaults alone.
 *
 * @returns {{ lines: string[], fontSize: number, lineHeight: number, baseline: number,
 *             shrunk: boolean }}
 */
export const layoutProfileCaption = (text, layout = PROFILE_LAYOUT, { locked: useLocks = true } = {}) => {
  const { caption } = layout
  const circle = layout.shape === 'circle'

  // An avatar measured from UNBC's own artwork is drawn exactly as measured.
  const locked = useLocks && findLockedProfile(text, layout.shape)
  if (locked) {
    return {
      lines: [...locked.lines],
      fontSize: locked.fontSize,
      lineHeight: locked.lineHeight,
      baseline: round(locked.capTop + locked.fontSize * CAP_HEIGHT),
      shrunk: false
    }
  }

  if (!circle) {
    const placed = layoutSquareCaption(text, layout)
    return {
      lines: placed.lines,
      fontSize: placed.fontSize,
      lineHeight: placed.lineHeight,
      baseline: placed.baseline,
      shrunk: placed.fontSize < placed.style.fontSize
    }
  }

  // The circle centres the block in the white half, and shrinks it until every line sits inside.
  const fit = (fontSize) => {
    const lines = wrapCaption(text, fontSize, caption.maxWidth, 'circle')
    const lineHeight = caption.lineHeight * fontSize / caption.fontSize
    const { top, bottom, ...placed } = placeBlock(lines, fontSize, lineHeight, caption.blockCenter)
    return { ...placed, fits: fitsCircle(placed, layout) }
  }

  let result = fit(caption.fontSize)
  while (!result.fits && result.fontSize - FONT_STEP >= caption.minFontSize) {
    result = fit(round(result.fontSize - FONT_STEP))
  }

  const { fits, ...rest } = result
  return { ...rest, shrunk: result.fontSize < caption.fontSize }
}

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
