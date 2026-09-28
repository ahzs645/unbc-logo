import assert from 'node:assert/strict'
import test from 'node:test'
import { LOGO_VIEWBOX } from './logoText.js'
import {
  escapeXml,
  measureLockupHeight,
  renderCrestSvg,
  renderLogoSvg
} from './renderLogoSvg.js'

const viewBoxOf = (svg) => svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number)

test('renders a parseable standalone SVG document', () => {
  const svg = renderLogoSvg({ departmentText: 'School of Engineering' })

  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'))
  assert.ok(svg.endsWith('</svg>'))
  assert.equal((svg.match(/<svg/g) || []).length, 1)
})

test('escapes author-supplied text so custom input cannot break the markup', () => {
  const svg = renderLogoSvg({ departmentText: 'Arts & <Sciences>' })

  assert.ok(svg.includes('Arts &amp; &lt;Sciences&gt;'))
  assert.ok(!svg.includes('<Sciences>'))
  assert.equal(escapeXml('a"b'), 'a&quot;b')
})

test('keeps the native canvas for lockups that fit, and grows for ones that do not', () => {
  // One to three department lines fit inside the artwork's 80-unit box.
  assert.equal(measureLockupHeight(0), LOGO_VIEWBOX.height)
  assert.equal(measureLockupHeight(3), LOGO_VIEWBOX.height)
  assert.ok(measureLockupHeight(5) > LOGO_VIEWBOX.height)

  // Each extra line past the fit point adds exactly one line height.
  assert.equal(measureLockupHeight(6) - measureLockupHeight(5), 10)
})

test('a tall lockup is not clipped by the canvas', () => {
  const svg = renderLogoSvg({
    departmentText: 'Faculty of Indigenous Studies, Social Sciences and Humanities\nSecond Line\nThird Line'
  })
  const [, , , height] = viewBoxOf(svg)

  const baselines = [...svg.matchAll(/<text[^>]*\sy="([\d.]+)"/g)].map((m) => Number(m[1]))
  assert.ok(baselines.length >= 5, 'expected the text to wrap to several lines')
  assert.ok(height > Math.max(...baselines), 'canvas must extend past the last baseline')
})

test('padding expands the viewBox on every side', () => {
  const [x, y, width, height] = viewBoxOf(renderLogoSvg({ padding: 10 }))

  assert.deepEqual([x, y], [-10, -10])
  assert.equal(width, LOGO_VIEWBOX.width + 20)
  assert.equal(height, LOGO_VIEWBOX.height + 20)
})

test('pixelWidth sets dimensions that preserve the aspect ratio', () => {
  const svg = renderLogoSvg({ pixelWidth: 356 })

  assert.ok(svg.includes('width="356"'))
  // 178×80 at double scale.
  assert.ok(svg.includes('height="160"'))
})

test('renders the crest at its own native viewBox', () => {
  const [, , width, height] = viewBoxOf(renderCrestSvg())

  assert.equal(width, 59.27)
  assert.equal(height, 67.82)
})

test('embedded font CSS lands in defs so a standalone file is self-contained', () => {
  const svg = renderLogoSvg({ departmentText: 'Physics', fontCss: '@font-face{font-family:X;}' })
  assert.ok(svg.includes('<defs><style>@font-face{font-family:X;}</style></defs>'))
})

test('centres the lockup on a square canvas when asked', () => {
  const [x, y, width, height] = viewBoxOf(renderLogoSvg({ square: true, padding: 8 }))
  assert.equal(width, height)
  // The lockup is wider than tall, so only the vertical margin grows.
  assert.equal(x, -8)
  assert.ok(y < -8)

  const svg = renderLogoSvg({ square: true, pixelWidth: 1024 })
  assert.ok(svg.includes('width="1024" height="1024"'))
})
