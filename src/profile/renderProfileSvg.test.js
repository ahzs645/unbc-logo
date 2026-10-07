import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PROFILE_CIRCLE_LAYOUT,
  PROFILE_LAYOUT,
  UNBC_LETTERS,
  findCircleCropOverflow,
  layoutProfileCaption,
  profileCaptionText,
  profileLayout,
  renderProfileSvg
} from './renderProfileSvg.js'
import { LOCKED_PROFILES } from './lockedProfiles.js'
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

test('sets the square caption by its line count, as the department avatars do', () => {
  // The defaults alone; these avatars are also locked at their measured values.
  const [one, two, three] = PROFILE_LAYOUT.caption.styles
  const capTop = (layout) => layout.baseline - layout.fontSize * 0.7

  // One line, large and centred in the band (Sustainability, Northwest, Bookstore).
  const northwest = layoutProfileCaption('Northwest', PROFILE_LAYOUT, { locked: false })
  assert.deepEqual(northwest.lines, ['Northwest'])
  assert.equal(northwest.fontSize, one.fontSize)
  assert.ok(Math.abs(capTop(northwest) - 118.5) < 0.2)

  // Two lines a size down (School of Engineering).
  const engineering = layoutProfileCaption('School of Engineering', PROFILE_LAYOUT, { locked: false })
  assert.deepEqual(engineering.lines, ['School of', 'Engineering'])
  assert.equal(engineering.fontSize, two.fontSize)
  assert.ok(Math.abs(capTop(engineering) - 108.8) < 0.2)

  // Three lines smaller and tighter (Geography, Earth & Environmental Sciences).
  const geography = layoutProfileCaption('Geography, Earth & Environmental Sciences', PROFILE_LAYOUT, { locked: false })
  assert.deepEqual(geography.lines, ['Geography, Earth', '& Environmental', 'Sciences'])
  assert.equal(geography.fontSize, three.fontSize)
  assert.ok(Math.abs(capTop(geography) - 105.8) < 0.2)
  assert.equal(geography.shrunk, false)
})

test('breaks captions evenly, the way UNBC\'s avatars do', () => {
  assert.deepEqual(layoutProfileCaption('Conference & Event Services').lines, ['Conference &', 'Event Services'])
  assert.deepEqual(
    layoutProfileCaption('Indigenous Studies, Social Sciences and Humanities').lines,
    ['Indigenous Studies,', 'Social Sciences and', 'Humanities']
  )
})

test('shrinks names longer than three lines so they stay in the band', () => {
  const layout = layoutProfileCaption('Department of Computer Science and Mathematics and Statistics and More')
  assert.ok(layout.shrunk)
  assert.ok(layout.fontSize >= PROFILE_LAYOUT.caption.minFontSize)

  const lastBaseline = layout.baseline + (layout.lines.length - 1) * layout.lineHeight
  assert.ok(lastBaseline + layout.fontSize * 0.17 <= PROFILE_LAYOUT.size - PROFILE_LAYOUT.caption.bottomMargin)
  assert.ok(layout.baseline - layout.fontSize * 0.7 >= PROFILE_LAYOUT.panelHeight + PROFILE_LAYOUT.caption.topGap)
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
  // The Department of Geography, Earth and Environmental Sciences avatar.
  assert.deepEqual(
    layoutProfileCaption(profileCaptionText('Department of Geography, Earth and Environmental Sciences')).lines,
    ['Geography, Earth', '& Environmental', 'Sciences']
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

test('the circle layout breaks the Graphics Standards Manual examples as they do', () => {
  ;[['Wood Engineering', ['Wood', 'Engineering']], ['Graduate Programs', ['Graduate', 'Programs']]]
    .forEach(([name, lines]) => {
      // The defaults alone, without the locks.
      const layout = layoutProfileCaption(name, PROFILE_CIRCLE_LAYOUT, { locked: false })
      assert.deepEqual(layout.lines, lines)
      assert.equal(layout.fontSize, PROFILE_CIRCLE_LAYOUT.caption.fontSize)
      // Both sit in the white half, below the band's top edge.
      assert.ok(layout.baseline - layout.fontSize * 0.7 > PROFILE_CIRCLE_LAYOUT.panelHeight)
    })
})

test('measured avatars are drawn exactly as measured', () => {
  LOCKED_PROFILES.forEach((locked) => {
    const layout = layoutProfileCaption(locked.text, profileLayout(locked.shape))
    assert.deepEqual(layout.lines, locked.lines)
    assert.equal(layout.fontSize, locked.fontSize)
    assert.equal(layout.lineHeight, locked.lineHeight)
    assert.ok(Math.abs(layout.baseline - locked.fontSize * 0.7 - locked.capTop) < 0.01)
    // The lock holds the measured style; the defaults alone break the lines the same way.
    assert.deepEqual(layoutProfileCaption(locked.text, profileLayout(locked.shape), { locked: false }).lines, locked.lines)
  })
  // A lock belongs to its shape, and a hand-made break skips it.
  assert.equal(layoutProfileCaption('MBA', PROFILE_CIRCLE_LAYOUT).fontSize, PROFILE_CIRCLE_LAYOUT.caption.fontSize)
  assert.deepEqual(layoutProfileCaption('Faculty of Science\n& Engineering').fontSize, PROFILE_LAYOUT.caption.styles[1].fontSize)
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
