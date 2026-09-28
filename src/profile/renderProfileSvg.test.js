import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PROFILE_LAYOUT,
  UNBC_LETTERS,
  findCircleCropOverflow,
  layoutProfileCaption,
  renderProfileSvg
} from './renderProfileSvg.js'
import { buildFileName } from '../export/exportLogo.js'

test('renders a square, standalone SVG document', () => {
  const svg = renderProfileSvg({ departmentText: 'Student Life', pixelWidth: 400 })

  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"'))
  assert.ok(svg.includes('width="400" height="400"'))
  assert.ok(svg.endsWith('</svg>'))
  assert.ok(svg.includes('>Student Life</text>'))
})

test('draws only the four UNBC letters, not the lockup subtitle', () => {
  assert.equal((UNBC_LETTERS.match(/<(path|polygon)\b/g) || []).length, 4)
  // The first shape is the "U"'s leading polygon in the source artwork.
  assert.ok(UNBC_LETTERS.startsWith('<polygon points="17.3 6.57'))
})

test('matches the reference layout for short names', () => {
  assert.deepEqual(layoutProfileCaption('Faculty of Environment').lines, ['Faculty of', 'Environment'])
  assert.deepEqual(layoutProfileCaption('Student Life').lines, ['Student Life'])
  assert.equal(layoutProfileCaption('Student Life').fontSize, PROFILE_LAYOUT.caption.fontSize)
  assert.equal(layoutProfileCaption('Student Life').shrunk, false)
})

test('shrinks long names so the last line clears the bottom edge', () => {
  const layout = layoutProfileCaption('Department of Computer Science and Mathematics')
  assert.ok(layout.shrunk)
  assert.ok(layout.fontSize >= PROFILE_LAYOUT.caption.minFontSize)

  const lastBaseline = layout.baseline + (layout.lines.length - 1) * layout.lineHeight
  assert.ok(lastBaseline < PROFILE_LAYOUT.size)
})

test('flags caption lines a circular crop would clip', () => {
  assert.deepEqual(findCircleCropOverflow('Faculty of Environment'), [])
  assert.ok(findCircleCropOverflow('Department of Computer Science and Mathematics').length > 0)
})

test('uses a gradient panel by default and a flat fill when given a colour', () => {
  assert.ok(renderProfileSvg().includes('<radialGradient'))

  const flat = renderProfileSvg({ background: 'green' })
  assert.ok(!flat.includes('<radialGradient'))
  assert.ok(flat.includes('fill="#035642"'))
})

test('escapes author-supplied caption text', () => {
  const svg = renderProfileSvg({ departmentText: 'Arts & <Sciences>' })
  assert.ok(svg.includes('Arts &amp; &lt;Sciences&gt;'))
  assert.ok(!svg.includes('<Sciences>'))
})

test('names a profile file after its department', () => {
  assert.equal(
    buildFileName({ mark: 'profile', departmentText: 'Student Life', format: 'png' }),
    'unbc-profile-student-life.png'
  )
})
