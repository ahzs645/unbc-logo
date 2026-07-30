import assert from 'node:assert/strict'
import test from 'node:test'
import { EXPORT_FORMATS, EXPORT_FORMAT_ORDER, buildFileName } from './exportLogo.js'

test('names a wordmark file after its department and colour', () => {
  assert.equal(
    buildFileName({ departmentText: 'School of Engineering', color: 'green', format: 'png' }),
    'unbc-logo-school-of-engineering-green.png'
  )
})

test('omits absent parts instead of writing "undefined" into the filename', () => {
  // The crest has no department line, and is coloured by `variant` rather than `color`.
  assert.equal(
    buildFileName({ mark: 'crest', variant: 'full', format: 'svg' }),
    'unbc-crest-full.svg'
  )
  assert.equal(buildFileName({ format: 'svg' }), 'unbc-logo-white.svg')
})

test('uses the conventional .jpg extension for JPEG', () => {
  assert.ok(buildFileName({ departmentText: 'Physics', format: 'jpeg' }).endsWith('.jpg'))
})

test('collapses punctuation and trims separators in department names', () => {
  assert.equal(
    buildFileName({ departmentText: "Women's and Gender Studies", format: 'svg' }),
    'unbc-logo-women-s-and-gender-studies-white.svg'
  )
})

test('every advertised format has a complete spec', () => {
  EXPORT_FORMAT_ORDER.forEach((key) => {
    const spec = EXPORT_FORMATS[key]
    assert.ok(spec, `${key} is ordered but not defined`)
    assert.ok(spec.label && spec.extension && spec.mimeType, `${key} spec is incomplete`)
  })
  assert.equal(EXPORT_FORMAT_ORDER.length, Object.keys(EXPORT_FORMATS).length)
})

test('only JPEG is declared as lacking an alpha channel', () => {
  // The raster path relies on this flag to decide whether to composite onto an opaque base.
  assert.equal(EXPORT_FORMATS.jpeg.alpha, false)
  assert.equal(EXPORT_FORMATS.png.alpha, true)
  assert.equal(EXPORT_FORMATS.webp.alpha, true)
})
