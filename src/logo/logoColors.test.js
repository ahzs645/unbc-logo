import assert from 'node:assert/strict'
import test from 'node:test'
import { BRAND_COLORS, isLightColor, recolorCrest, recolorMark, resolveColor } from './logoColors.js'
import { ALUMNI_BADGE, UNBC_LOGO } from '../assets/markup.js'
import { renderCrestSvg, renderLogoSvg } from './renderLogoSvg.js'

const fills = (markup) => [...markup.matchAll(/\bfill="([^"]*)"/g)].map((match) => match[1])

test('resolves named variants and passes raw colours through', () => {
  assert.equal(resolveColor('green'), BRAND_COLORS.green)
  assert.equal(resolveColor('white'), '#ffffff')
  assert.equal(resolveColor('#c2952d'), '#c2952d')
  assert.equal(resolveColor(undefined, 'none'), 'none')
})

test('recolours every fill in the wordmark without touching fill-rule', () => {
  const recoloured = recolorMark(UNBC_LOGO.inner, '#000000')

  assert.ok(fills(UNBC_LOGO.inner).length > 30, 'expected the wordmark to have many fills')
  assert.deepEqual([...new Set(fills(recoloured))], ['#000000'])
  // fill-rule="evenodd" drives the shape of the wordmark's counters; clobbering it would
  // fill in the holes in letters like "U" and "C".
  assert.equal(
    (recoloured.match(/fill-rule="evenodd"/g) || []).length,
    (UNBC_LOGO.inner.match(/fill-rule="evenodd"/g) || []).length
  )
})

test('flattens the crest but preserves its knockouts as a separate colour', () => {
  const black = recolorCrest(ALUMNI_BADGE.inner, '#000000')
  const unique = new Set(fills(black))

  // Body ink plus the white knockout detail — never a single flat colour, which would fill in
  // the UNBC wordmark and the ALUMNI banner and leave a solid blob.
  assert.deepEqual([...unique].sort(), ['#000000', '#ffffff'])
})

test('a white crest makes its knockouts transparent so a dark ground shows through', () => {
  const white = recolorCrest(ALUMNI_BADGE.inner, '#ffffff')
  assert.deepEqual([...new Set(fills(white))].sort(), ['#ffffff', 'none'])
})

test('an explicit knockout colour overrides the light/dark default', () => {
  const custom = recolorCrest(ALUMNI_BADGE.inner, '#055b42', '#c2952d')
  assert.deepEqual([...new Set(fills(custom))].sort(), ['#055b42', '#c2952d'])
})

test('classifies light and dark colours for knockout selection', () => {
  assert.equal(isLightColor('#ffffff'), true)
  assert.equal(isLightColor('#fff'), true)
  assert.equal(isLightColor('#000000'), false)
  assert.equal(isLightColor(BRAND_COLORS.green), false)
  // Unmeasurable colours fall back to "dark", keeping the white knockout.
  assert.equal(isLightColor('rgb(255 255 255)'), false)
})

test('the department line takes its own colour when one is given', () => {
  const svg = renderLogoSvg({
    departmentText: 'School of Engineering',
    color: 'green',
    departmentColor: 'black'
  })

  assert.match(svg, /<text[^>]*fill="#000000"[^>]*>School of Engineering<\/text>/)
  assert.ok(svg.includes(`fill="${BRAND_COLORS.green}"`), 'wordmark should be green')
})

test('the department line follows the logo colour by default', () => {
  const svg = renderLogoSvg({ departmentText: 'Physics', color: 'black' })
  assert.match(svg, /<text[^>]*fill="#000000"[^>]*>Physics<\/text>/)
})

test('a transparent background paints no rect, a chosen one does', () => {
  assert.ok(!renderLogoSvg({ background: 'none' }).includes('<rect'))
  assert.ok(renderCrestSvg({ background: 'green' }).includes(`<rect`))
  assert.ok(renderCrestSvg({ background: 'green' }).includes(BRAND_COLORS.green))
})
