// Turns the brand SVG artwork into a plain-JS module.
//
// The core logic must run anywhere — a Vite app, a Node script, a Cloudflare worker — so the
// artwork can't rely on Vite's `?raw` import suffix. This bakes the markup into real ES module
// strings instead. Run `npm run build:assets` after editing an .svg; `npm test` fails if the
// generated module has drifted from its source.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const assetsDir = new URL('../src/assets/', import.meta.url)

const SOURCES = [
  { file: 'unbc-logo.svg', export: 'UNBC_LOGO' },
  { file: 'alumni-badge.svg', export: 'ALUMNI_BADGE' }
]

// Pulls the drawable markup out of an <svg> wrapper so it can be inlined into a <g>.
const innerMarkup = (svgText) =>
  svgText.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')

const viewBoxOf = (svgText) => {
  const match = svgText.match(/viewBox="([\d.\-\s]+)"/i)
  if (!match) throw new Error('artwork is missing a viewBox')
  const [, , width, height] = match[1].trim().split(/\s+/).map(Number)
  return { width, height }
}

// The wordmark artwork carries an empty <text id="svgDepartmentText"> placeholder left over from
// the production Illustrator file. We draw the department line ourselves from measured metrics,
// so drop the placeholder rather than ship a dead node into every export.
const stripDepartmentPlaceholder = (markup) =>
  markup.replace(/<text[^>]*id="svgDepartmentText"[\s\S]*?<\/text>/i, '')

// Collapse the deep indentation the export tool emitted; it is pure payload in every SVG we ship.
const collapseWhitespace = (markup) => markup.replace(/>\s+</g, '><').trim()

export const buildAssetModule = () => {
  const entries = SOURCES.map((source) => {
    const svgText = readFileSync(new URL(source.file, assetsDir), 'utf8')
    const inner = collapseWhitespace(stripDepartmentPlaceholder(innerMarkup(svgText)))
    return { ...source, viewBox: viewBoxOf(svgText), inner }
  })

  const body = entries
    .map(({ export: name, file, viewBox, inner }) => (
      `// Generated from ${file}\n` +
      `export const ${name} = {\n` +
      `  viewBox: { width: ${viewBox.width}, height: ${viewBox.height} },\n` +
      `  inner: ${JSON.stringify(inner)}\n` +
      `}\n`
    ))
    .join('\n')

  return `// GENERATED FILE — do not edit by hand.\n` +
    `// Run \`npm run build:assets\` to regenerate from src/assets/*.svg.\n\n${body}`
}

const outputPath = fileURLToPath(new URL('markup.js', assetsDir))

// Only write when invoked directly, so the drift test can import buildAssetModule() read-only.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(outputPath, buildAssetModule())
  console.log(`Wrote ${outputPath}`)
}
