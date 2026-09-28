// Browser export pipeline: one lockup description in, a downloadable file out.
//
// Everything routes through renderLogoSvg() so an exported PNG is the same drawing as the live
// preview. Raster formats go SVG string → <img> → <canvas> → Blob, which keeps the text crisp at
// any size because the vector is rasterized at the target resolution rather than upscaled.

import { renderCrestSvg, renderLogoSvg } from '../logo/renderLogoSvg.js'
import { renderProfileSvg } from '../profile/renderProfileSvg.js'
import { getEmbeddedFontCss } from './fontEmbed.js'

export const EXPORT_FORMATS = {
  svg: { label: 'SVG', extension: 'svg', mimeType: 'image/svg+xml', vector: true },
  png: { label: 'PNG', extension: 'png', mimeType: 'image/png', alpha: true },
  webp: { label: 'WebP', extension: 'webp', mimeType: 'image/webp', alpha: true },
  // JPEG has no alpha channel; a transparent request is composited onto white instead.
  jpeg: { label: 'JPEG', extension: 'jpg', mimeType: 'image/jpeg', alpha: false }
}

export const EXPORT_FORMAT_ORDER = ['svg', 'png', 'webp', 'jpeg']

// Raster size presets, in pixels of lockup width.
export const SIZE_PRESETS = [512, 1024, 2048, 4096]

// Square sizes for profile pictures: X/Twitter's 400, LinkedIn/Facebook-friendly 800, Instagram's
// 1080, and a large master.
export const PROFILE_SIZE_PRESETS = [400, 800, 1080, 2048]

const DEFAULT_PIXEL_WIDTH = 1024

// Not every browser can encode every format (WebP in particular lagged in Safari). Probing a 1px
// canvas tells us before the user picks a format that would silently produce a PNG instead.
export const isFormatSupported = (format) => {
  const spec = EXPORT_FORMATS[format]
  if (!spec) return false
  if (spec.vector) return true
  if (typeof document === 'undefined') return false

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL(spec.mimeType).startsWith(`data:${spec.mimeType}`)
}

// "School of Engineering" → "school-of-engineering", for a readable download filename.
// Absent values yield '' rather than the string "undefined", so buildFileName can drop them.
const slugify = (value) => (value == null ? '' : String(value))
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60)

export const buildFileName = ({ departmentText, color, variant, mark = 'logo', format }) => {
  // The crest is coloured by `variant`, the wordmark by `color`; a profile picture has no single
  // tone worth naming.
  const tone = mark === 'crest' ? (variant || 'full') : mark === 'profile' ? '' : (color || 'white')
  const parts = ['unbc', mark, slugify(departmentText), slugify(tone)].filter(Boolean)
  return `${parts.join('-')}.${EXPORT_FORMATS[format]?.extension || format}`
}

const RENDERERS = { logo: renderLogoSvg, crest: renderCrestSvg, profile: renderProfileSvg }

// Builds the SVG source for any mark, with the brand font embedded so the result is
// self-contained. `mark` is 'logo' (the wordmark lockup), 'crest' (the Alumni badge), or
// 'profile' (the square social-media avatar).
export const buildSvgSource = async ({ mark = 'logo', ...options } = {}) => {
  const render = RENDERERS[mark]
  if (!render) throw new Error(`Unknown mark: ${mark}`)
  const fontCss = mark === 'crest' ? undefined : await getEmbeddedFontCss()
  return render({ ...options, fontCss })
}

// Rasterizes an SVG string at a target pixel width. The SVG carries explicit width/height
// attributes so the <img> reports a definite intrinsic size in every browser (Firefox will not
// infer one from viewBox alone).
const rasterize = async (svgSource, { mimeType, quality, background }) => {
  const blob = new Blob([svgSource], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Could not rasterize the lockup SVG'))
      element.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height

    const context = canvas.getContext('2d')
    if (background) {
      context.fillStyle = background
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => result
          ? resolve(result)
          : reject(new Error(`This browser cannot encode ${mimeType}`)),
        mimeType,
        quality
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Renders a lockup to a Blob in the requested format.
 *
 * @param {object} options              Everything renderLogoSvg() accepts, plus:
 * @param {string} [options.mark]       'logo' | 'crest' | 'profile'
 * @param {string} [options.format]     'svg' | 'png' | 'webp' | 'jpeg'
 * @param {number} [options.pixelWidth] Output width for raster formats.
 * @param {number} [options.quality]    0–1, for WebP and JPEG.
 */
export const renderLogoBlob = async ({
  format = 'png',
  pixelWidth = DEFAULT_PIXEL_WIDTH,
  quality = 0.92,
  ...options
} = {}) => {
  const spec = EXPORT_FORMATS[format]
  if (!spec) throw new Error(`Unsupported export format: ${format}`)

  const svgSource = await buildSvgSource({ ...options, pixelWidth })

  if (spec.vector) {
    return new Blob([svgSource], { type: `${spec.mimeType};charset=utf-8` })
  }

  // renderLogoSvg() already paints any requested background into the SVG itself, so PNG and WebP
  // need no canvas fill — omitting it is what preserves transparency when none was requested.
  // JPEG has no alpha channel and composites unpainted pixels to black, so it always gets an
  // opaque base; where the SVG does paint a background, that base is simply covered over.
  const background = spec.alpha ? null : '#ffffff'

  return rasterize(svgSource, { mimeType: spec.mimeType, quality, background })
}

// Saves a Blob under `fileName` via a temporary object URL.
export const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking synchronously can cancel the download in Safari; defer past the click.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Renders and downloads a lockup in one call. Returns the filename it saved. */
export const exportLogo = async (options = {}) => {
  const blob = await renderLogoBlob(options)
  const fileName = options.fileName || buildFileName({ ...options, format: options.format || 'png' })
  downloadBlob(blob, fileName)
  return fileName
}
