import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PROFILE_CIRCLE_LAYOUT,
  PROFILE_LAYOUT,
  UNBC_LETTERS,
  findCircleCropOverflow,
  layoutProfileCaption,
  profileCaptionText,
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
  assert.equal(
    buildFileName({ mark: 'profile', departmentText: 'Wood Engineering', shape: 'circle', format: 'png' }),
    'unbc-profile-wood-engineering-circle.png'
  )
})

test('faculty avatars drop "Faculty of"; other names print as given', () => {
  assert.equal(
    profileCaptionText('Faculty of Indigenous Studies, Social Sciences and Humanities'),
    'Indigenous Studies, Social Sciences and Humanities'
  )
  assert.equal(profileCaptionText('Faculty of Environment'), 'Environment')
  assert.equal(profileCaptionText('School of Engineering'), 'School of Engineering')
  assert.equal(profileCaptionText('Department of Psychology'), 'Department of Psychology')
  assert.equal(profileCaptionText(''), '')
})

test('a faculty whose avatar has been checked prints what that avatar does', () => {
  // UNBC's Faculty of Science and Engineering avatar keeps "Faculty of" and sets "&".
  assert.equal(profileCaptionText('Faculty of Science and Engineering'), 'Faculty of Science & Engineering')
  assert.deepEqual(
    layoutProfileCaption(profileCaptionText('Faculty of Science and Engineering')).lines,
    ['Faculty of Science', '& Engineering']
  )
})

test('the square layout breaks captions as UNBC\'s own avatars do', () => {
  // The Faculty of Indigenous Studies, Social Sciences and Humanities and School of Engineering
  // avatars: "and" stays at the end of a caption line.
  assert.deepEqual(
    layoutProfileCaption(profileCaptionText('Faculty of Indigenous Studies, Social Sciences and Humanities')).lines,
    ['Indigenous Studies,', 'Social Sciences and', 'Humanities']
  )
  assert.deepEqual(layoutProfileCaption('School of Engineering').lines, ['School of', 'Engineering'])
})

test('the circle layout matches the Graphics Standards Manual examples', () => {
  ;[['Wood Engineering', ['Wood', 'Engineering']], ['Graduate Programs', ['Graduate', 'Programs']]]
    .forEach(([name, lines]) => {
      const layout = layoutProfileCaption(name, PROFILE_CIRCLE_LAYOUT)
      assert.deepEqual(layout.lines, lines)
      assert.equal(layout.fontSize, PROFILE_CIRCLE_LAYOUT.caption.fontSize)
      // Both sit in the white half, below the band's top edge.
      assert.ok(layout.baseline - layout.fontSize * 0.7 > PROFILE_CIRCLE_LAYOUT.panelHeight)
    })
})

test('the circle layout shrinks long captions until they fit inside the circle', () => {
  const name = 'International Exchanges and Student Programs'
  const layout = layoutProfileCaption(name, PROFILE_CIRCLE_LAYOUT)
  assert.ok(layout.shrunk)
  assert.deepEqual(findCircleCropOverflow(name, PROFILE_CIRCLE_LAYOUT), [])
  // On the square, by contrast, a long caption can still run into a platform's circular crop.
  assert.ok(findCircleCropOverflow('Department of Computer Science and Mathematics').length > 0)
})

test('renders the circle layout clipped to a circle, transparent outside it', () => {
  const svg = renderProfileSvg({ departmentText: 'Wood Engineering', shape: 'circle' })
  assert.ok(svg.includes('<clipPath id="unbc-profile-circle"><circle cx="75" cy="75" r="75"/></clipPath>'))
  assert.ok(svg.includes('<g clip-path="url(#unbc-profile-circle)"><rect width="150" height="150"'))
  assert.ok(svg.includes('<rect width="150" height="75"'))
  assert.ok(!renderProfileSvg({ departmentText: 'Wood Engineering' }).includes('clipPath'))
})
