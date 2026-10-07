import { findLockedLines } from './lockedLockups.js'

// Geometry of the UNBC logo lockup, in the logo's own 178×80 viewBox coordinates.
// The department line sits where the original artwork's (empty) #svgDepartmentText element was:
// inside logoAndTextGroup (translate 0,15) at translate(57.73, 36.56) → viewBox (57.73, 51.56),
// font-size 8.23, weight 800, white — left-aligned under the "NORTHERN BRITISH COLUMBIA" line.
export const LOGO_VIEWBOX = { width: 178, height: 80 }
export const DEPARTMENT_LINE = {
  x: 57.73,
  y: 51.56,
  lineHeight: 10,
  fontSize: 8.23,
  fontWeight: 800,
  // The department lockup runs from x=57.73 to the right edge of the 178-unit artwork.
  // A small allowance accounts for the font's negative kerning at common letter pairs.
  maxWidth: 122
}

// Advance widths from the bundled HelveticaNeueBlack font, in its native 1000-unit em.
// Keeping these metrics here makes wrapping deterministic in the preview, PNG, and PDF
// exporters instead of depending on whether a browser canvas has finished loading the font.
const ASCII_START = 32
const ASCII_ADVANCES = [
  334, 315, 519, 668, 668, 1019, 741, 296, 315, 315, 463, 600, 334, 407, 334, 426,
  668, 668, 668, 668, 668, 668, 668, 668, 668, 668, 334, 334, 600, 600, 600, 574,
  800, 722, 741, 759, 778, 704, 630, 778, 759, 333, 611, 778, 630, 944, 759, 796,
  704, 796, 741, 667, 668, 759, 648, 963, 741, 667, 685, 407, 426, 407, 600, 500,
  278, 611, 648, 611, 648, 630, 389, 630, 648, 315, 315, 611, 315, 963, 648, 630,
  648, 648, 444, 574, 407, 648, 556, 870, 556, 556, 556, 407, 222, 407, 600
]
const FALLBACK_ADVANCE = 600

export const measureDepartmentText = (text) => {
  const advance = Array.from(text).reduce((total, character) => {
    const index = character.codePointAt(0) - ASCII_START
    return total + (ASCII_ADVANCES[index] || FALLBACK_ADVANCE)
  }, 0)

  return advance * DEPARTMENT_LINE.fontSize / 1000
}

// Words that open a line rather than close one. UNBC's own sub-logos carry a conjunction down to
// the next line: "Faculty of Human / and Health Sciences", "Studies, Social Sciences / and
// Humanities", "Northern BC Archives / & Special Collections".
export const LOCKUP_LINE_OPENERS = ['and', '&']

const wrapDepartmentParagraph = (paragraph, maxWidth, lineOpeners) => {
  const words = paragraph.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word

    if (!currentLine || measureDepartmentText(candidate) <= maxWidth) {
      currentLine = candidate
      return
    }

    // A conjunction left at the end of the line moves down to open the next one — unless that
    // would push the next line past the lockup, or leave nothing behind.
    const lastSpace = currentLine.lastIndexOf(' ')
    const lastWord = currentLine.slice(lastSpace + 1)
    const carried = `${lastWord} ${word}`
    if (lastSpace > 0 && lineOpeners.has(lastWord.toLowerCase()) && measureDepartmentText(carried) <= maxWidth) {
      lines.push(currentLine.slice(0, lastSpace))
      currentLine = carried
      return
    }

    lines.push(currentLine)
    currentLine = word
  })

  lines.push(currentLine)
  return lines
}

// Breaks a paragraph into the fewest lines that fit, and among those picks the breaks that fill
// the lines most evenly (least squared slack, the last line free to run short, as in typesetting).
// It is how UNBC's avatars break: "Conference & / Event Services", but "Geography, Earth / &
// Environmental / Sciences", and "Social Sciences and / Humanities". A single word wider than the
// line still gets a line of its own.
const balanceDepartmentParagraph = (paragraph, maxWidth, minLines = 1) => {
  const words = paragraph.trim().split(/\s+/).filter(Boolean)
  const count = words.length
  if (count === 0) return []

  const width = (from, to) => measureDepartmentText(words.slice(from, to).join(' '))
  // exact[k][i]: the cheapest way to set words i… in exactly k lines, or nothing if they can't be.
  const exact = [[]]
  exact[0][count] = { cost: 0 }
  for (let lines = 1; lines <= count; lines++) {
    exact[lines] = []
    for (let from = count - 1; from >= 0; from--) {
      for (let to = from + 1; to <= count; to++) {
        const lineWidth = width(from, to)
        if (to - from > 1 && lineWidth > maxWidth) break
        const rest = exact[lines - 1][to]
        if (!rest) continue
        const slack = to === count ? 0 : Math.max(0, maxWidth - lineWidth)
        const cost = rest.cost + slack ** 2
        if (!exact[lines][from] || cost < exact[lines][from].cost) exact[lines][from] = { cost, next: to }
      }
    }

    // The fewest lines that fit (and at least minLines), set as evenly as possible.
    if (lines >= minLines && exact[lines][0]) {
      const result = []
      for (let left = lines, from = 0; left > 0; left--) {
        const { next } = exact[left][from]
        result.push(words.slice(from, next).join(' '))
        from = next
      }
      return result
    }
  }

  // Fewer words than lines asked for: a word to a line.
  return words
}

/**
 * The department line broken by the wrapping rules alone, ignoring the locked lockups. Use
 * splitDepartmentText() to draw a lockup; this is for checking the rules against the locks.
 *
 * @param {object} [options]
 * @param {string[]} [options.lineOpeners] words carried down to open the next line rather than
 *   left closing one (defaults to the lockup's conjunctions).
 * @param {boolean} [options.balance] break into the fewest lines with the most even lengths,
 *   instead of filling each line in turn (used for centred captions; ignores lineOpeners).
 * @param {number} [options.minLines] with `balance`, use at least this many lines — for a
 *   caption that should take two lines rather than squeeze onto one. Ignored when the text has
 *   breaks of its own.
 */
export const wrapDepartmentText = (
  departmentText,
  maxWidth = DEPARTMENT_LINE.maxWidth,
  { lineOpeners = LOCKUP_LINE_OPENERS, balance = false, minLines = 1 } = {}
) => {
  if (!departmentText) return []
  const openers = new Set(lineOpeners.map((word) => word.toLowerCase()))
  const handBroken = /\r?\n/.test(departmentText.toString().trim())
  const wrapParagraph = balance
    ? (paragraph) => balanceDepartmentParagraph(paragraph, maxWidth, handBroken ? 1 : minLines)
    : (paragraph) => wrapDepartmentParagraph(paragraph, maxWidth, openers)

  // Preserve intentional line breaks while applying automatic wrapping within each line.
  return departmentText
    .toString()
    .split(/\r?\n/)
    .flatMap(wrapParagraph)
}

/**
 * The department line as the lockup draws it. A name matched to official sub-logo artwork
 * (lockedLockups.js) breaks exactly as that artwork does; anything else follows the rules.
 */
export const splitDepartmentText = (departmentText, maxWidth = DEPARTMENT_LINE.maxWidth, options) => {
  if (!departmentText) return []

  const text = departmentText.toString()
  if (maxWidth === DEPARTMENT_LINE.maxWidth && !/\r?\n/.test(text)) {
    const locked = findLockedLines(text)
    if (locked) return locked
  }

  return wrapDepartmentText(text, maxWidth, options)
}
