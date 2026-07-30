// Framework-free renderers for the UNBC marks.
//
// These build complete, self-contained SVG *strings*. Everything else in the package — the React
// components, the PNG/WebP exporters, the standalone generator site — is a thin wrapper over this
// file, so the wrapping rules and colour handling can never diverge between them. Being plain
// string-building (no DOM, no React, no bundler features) it also runs unchanged in Node, which
// is what makes the lockup usable from a build script or a server.

import { ALUMNI_BADGE, UNBC_LOGO } from '../assets/markup.js'
import { BRAND_COLORS, recolorCrest, recolorMark, resolveColor } from './logoColors.js'
import { DEPARTMENT_LINE, LOGO_VIEWBOX, splitDepartmentText } from './logoText.js'

export const LOGO_FONT_FAMILY = "'HelveticaNeueUNBC', 'Helvetica Neue', Helvetica, Arial, sans-serif"

export const CREST_VIEWBOX = ALUMNI_BADGE.viewBox

// Text in the department line is author-supplied, so it must be escaped before being concatenated
// into markup. Without this a name containing "&" produces an SVG that will not parse at all.
export const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

// Approximate descent below the baseline of the last department line, used to size the canvas.
const DESCENT_RATIO = 0.25
// Breathing room under the deepest ink so a tall lockup does not sit flush against the edge.
const BOTTOM_MARGIN = 4

// How tall the lockup needs to be for a given number of department lines. One to three lines fit
// inside the artwork's native 80-unit box; beyond that the canvas grows rather than clipping.
export const measureLockupHeight = (lineCount) => {
  if (!lineCount) return LOGO_VIEWBOX.height

  const lastBaseline = DEPARTMENT_LINE.y + (lineCount - 1) * DEPARTMENT_LINE.lineHeight
  const contentBottom = lastBaseline + DEPARTMENT_LINE.fontSize * DESCENT_RATIO + BOTTOM_MARGIN

  return Math.max(LOGO_VIEWBOX.height, contentBottom)
}

// Resolves the shared options both the string renderer and the React components need, so the two
// paths agree on wrapping, colour and canvas size. Exported for the React components' use.
export const resolveLockup = ({
  departmentText = '',
  color = 'white',
  departmentColor,
  maxWidth = DEPARTMENT_LINE.maxWidth
} = {}) => {
  const markColor = resolveColor(color)
  const lines = splitDepartmentText(departmentText, maxWidth)

  return {
    lines,
    markColor,
    // The department line defaults to the logo colour so a one-control change stays coherent,
    // but takes its own colour when the caller wants the contrast split.
    departmentFill: departmentColor ? resolveColor(departmentColor) : markColor,
    width: LOGO_VIEWBOX.width,
    height: measureLockupHeight(lines.length)
  }
}

const departmentTextMarkup = (lines, fill, fontFamily) => lines
  .map((line, index) => (
    `<text x="${DEPARTMENT_LINE.x}" y="${DEPARTMENT_LINE.y + index * DEPARTMENT_LINE.lineHeight}"` +
    ` font-family="${escapeXml(fontFamily)}" font-size="${DEPARTMENT_LINE.fontSize}"` +
    ` font-weight="${DEPARTMENT_LINE.fontWeight}" fill="${fill}">${escapeXml(line)}</text>`
  ))
  .join('')

// The wordmark lockup as an SVG fragment, for embedding in a larger drawing (this is what the
// door-sign artwork uses). Coordinates stay in the logo's native 178-unit space.
export const renderLogoMarkup = (options = {}) => {
  const { lines, markColor, departmentFill } = resolveLockup(options)
  const fontFamily = options.fontFamily || LOGO_FONT_FAMILY

  return recolorMark(UNBC_LOGO.inner, markColor) +
    departmentTextMarkup(lines, departmentFill, fontFamily)
}

// Wraps a fragment in a standalone <svg> document.
const wrapSvg = ({ inner, width, height, padding, background, pixelWidth, fontCss, title }) => {
  const viewWidth = width + padding * 2
  const viewHeight = height + padding * 2

  // A pixel width is optional; when given, the height follows the aspect ratio so callers never
  // have to compute it (and never accidentally distort the mark).
  const dimensions = pixelWidth
    ? ` width="${pixelWidth}" height="${Math.round(pixelWidth * viewHeight / viewWidth)}"`
    : ''

  const backgroundRect = background && background !== 'none'
    ? `<rect x="${-padding}" y="${-padding}" width="${viewWidth}" height="${viewHeight}" fill="${background}"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-padding} ${-padding} ${viewWidth} ${viewHeight}"${dimensions}>` +
    (title ? `<title>${escapeXml(title)}</title>` : '') +
    (fontCss ? `<defs><style>${fontCss}</style></defs>` : '') +
    backgroundRect +
    inner +
    '</svg>'
}

/**
 * The full UNBC wordmark lockup as a standalone SVG document string.
 *
 * @param {object} options
 * @param {string} [options.departmentText]   Department line; wraps automatically, and honours
 *                                            explicit newlines.
 * @param {string} [options.color]            'white' | 'black' | 'green' | any CSS colour.
 * @param {string} [options.departmentColor]  Colour for the department line; defaults to `color`.
 * @param {string} [options.background]       'none' (transparent) | 'green' | any CSS colour.
 * @param {number} [options.padding]          Margin around the mark, in viewBox units.
 * @param {number} [options.pixelWidth]       Sets width/height attributes at this pixel width.
 * @param {string} [options.fontCss]          CSS injected into <defs>, for embedding @font-face.
 * @param {number} [options.maxWidth]         Wrap width override, in viewBox units.
 * @returns {string} A complete <svg> document.
 */
export const renderLogoSvg = (options = {}) => {
  const { width, height } = resolveLockup(options)

  return wrapSvg({
    inner: renderLogoMarkup(options),
    width,
    height,
    padding: options.padding || 0,
    background: resolveColor(options.background, 'none'),
    pixelWidth: options.pixelWidth,
    fontCss: options.fontCss,
    title: options.title ?? 'University of Northern British Columbia'
  })
}

// The Alumni crest as an SVG fragment. `variant` is 'full' for the original gold/green/black
// artwork, or a colour (name or hex) to flatten it to a single-colour mark.
export const renderCrestMarkup = ({ variant = 'full', knockoutColor } = {}) => {
  if (variant === 'full') return ALUMNI_BADGE.inner
  return recolorCrest(ALUMNI_BADGE.inner, resolveColor(variant), knockoutColor)
}

// The Alumni crest as a standalone SVG document string.
export const renderCrestSvg = (options = {}) => wrapSvg({
  inner: renderCrestMarkup(options),
  width: CREST_VIEWBOX.width,
  height: CREST_VIEWBOX.height,
  padding: options.padding || 0,
  background: resolveColor(options.background, 'none'),
  pixelWidth: options.pixelWidth,
  fontCss: options.fontCss,
  title: options.title ?? 'UNBC Alumni'
})

export { BRAND_COLORS }
