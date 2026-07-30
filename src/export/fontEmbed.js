// Embeds the brand typeface directly into exported artwork.
//
// A standalone SVG — whether saved to disk or loaded into an <img> for rasterization — cannot see
// the host page's @font-face rules. Without this the department line silently falls back to a
// system sans and the export stops matching the on-screen preview.
//
// Only the Black (900) face is embedded: the wordmark itself is outlined paths, so the department
// line is the sole *text* in the lockup and it renders at weight 800, which CSS font matching
// resolves to the 900 face. Embedding the other faces would trade ~300KB per export for nothing.

// `new URL(..., import.meta.url)` is standard ESM that Vite also statically rewrites at build
// time, so this resolves both in a bundled app and in a plain module script. The specifier must
// stay a literal for that rewriting to happen — don't refactor it into a variable.
const BLACK_FACE_URL = new URL('../../fonts/HelveticaNeueBlack.ttf', import.meta.url).href

export const BRAND_FONT_FAMILY = 'HelveticaNeueUNBC'

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  // Chunked to stay under the argument-count limit of String.fromCharCode on large fonts.
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

let cachedCss = null

/**
 * Returns an @font-face rule with the brand face inlined as base64, ready to drop into an SVG
 * <style>. Cached after the first call — exports are usually run several times in a row.
 *
 * Resolves to an empty string if the font can't be fetched, so an export still succeeds (with a
 * fallback face) rather than failing outright.
 */
export const getEmbeddedFontCss = async () => {
  if (cachedCss !== null) return cachedCss

  try {
    const response = await fetch(BLACK_FACE_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const base64 = toBase64(await response.arrayBuffer())
    cachedCss =
      `@font-face{font-family:'${BRAND_FONT_FAMILY}';` +
      `src:url(data:font/truetype;base64,${base64}) format('truetype');` +
      `font-weight:900;font-style:normal;}`
  } catch (error) {
    console.error('Could not embed the brand font; export will use a fallback face.', error)
    cachedCss = ''
  }

  return cachedCss
}
