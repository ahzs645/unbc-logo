// Embeds the brand typeface directly into exported artwork.
//
// A standalone SVG — whether saved to disk or loaded into an <img> for rasterization — cannot see
// the host page's @font-face rules. Without this the department line silently falls back to a
// system sans and the export stops matching the on-screen preview.
//
// Only the face a mark actually draws is embedded. The lockup's department line renders at weight
// 800, which CSS font matching resolves to the Black (900) face; the profile picture's caption is
// Bold (700). Both files are Latin subsets of ~20KB, so an export does not carry a whole font.

// `new URL(..., import.meta.url)` is standard ESM that Vite also statically rewrites at build
// time, so this resolves both in a bundled app and in a plain module script. The specifiers must
// stay literals for that rewriting to happen — don't refactor them into variables.
const FACES = {
  black: { url: new URL('../../fonts/HelveticaNeueBlack.ttf', import.meta.url).href, weight: 900 },
  bold: { url: new URL('../../fonts/HelveticaNeueBoldLatin.ttf', import.meta.url).href, weight: 700 }
}

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

const cache = {}

/**
 * Returns an @font-face rule with a brand face inlined as base64, ready to drop into an SVG
 * <style>. `face` is 'black' (the lockup's department line) or 'bold' (the profile caption).
 * Cached per face after the first call — exports are usually run several times in a row.
 *
 * Resolves to an empty string if the font can't be fetched, so an export still succeeds (with a
 * fallback face) rather than failing outright.
 */
export const getEmbeddedFontCss = async (face = 'black') => {
  if (cache[face] !== undefined) return cache[face]

  const spec = FACES[face]
  if (!spec) throw new Error(`Unknown font face: ${face}`)

  try {
    const response = await fetch(spec.url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const base64 = toBase64(await response.arrayBuffer())
    cache[face] =
      `@font-face{font-family:'${BRAND_FONT_FAMILY}';` +
      `src:url(data:font/truetype;base64,${base64}) format('truetype');` +
      `font-weight:${spec.weight};font-style:normal;}`
  } catch (error) {
    console.error('Could not embed the brand font; export will use a fallback face.', error)
    cache[face] = ''
  }

  return cache[face]
}
