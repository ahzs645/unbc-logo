// Profile-picture captions measured from UNBC's own avatars, and locked to them.
//
// The square layout's defaults come from the department avatars (see PROFILE_LAYOUT), but not
// every avatar follows them: the Faculty of Science and Engineering's sets two lines smaller and
// tighter, and the Graphics Standards Manual's "Student Life" hangs high and small where its own
// "MBA" sits large and centred like the rest. So, as with locked lockups, an avatar that has been
// measured is reproduced exactly — lines, size, leading and position — while every other caption
// follows the defaults. Add an entry whenever an avatar is checked, with its source.
//
// All measurements are in the 150-unit avatar. `capTop` is the first line's cap top and
// `lineHeight` the distance between lines; `text` is the caption as the avatar prints it (after
// profileCaptionText), so "Faculty of Science and Engineering" finds the "&" entry below. A caption
// broken by hand is never locked.

const GSM_2020 = 'Graphics Standards Manual (Feb 2020), p. 5 — embedded 662px artwork'
const SUPPLIED = 'UNBC avatar artwork supplied for this kit (Oct 2026)'

export const LOCKED_PROFILES = [
  // The department avatars the square layout's defaults were measured from.
  { text: 'Sustainability', shape: 'square', lines: ['Sustainability'], fontSize: 14.8, lineHeight: 17.75, capTop: 118.3, source: SUPPLIED },
  { text: 'Northwest', shape: 'square', lines: ['Northwest'], fontSize: 14.6, lineHeight: 17.5, capTop: 118.3, source: SUPPLIED },
  { text: 'Bookstore', shape: 'square', lines: ['Bookstore'], fontSize: 14.5, lineHeight: 17.4, capTop: 118.5, source: SUPPLIED },
  {
    text: 'School of Engineering',
    shape: 'square',
    lines: ['School of', 'Engineering'],
    fontSize: 12.35,
    lineHeight: 14.9,
    capTop: 108.8,
    source: SUPPLIED
  },
  {
    text: 'Geography, Earth & Environmental Sciences',
    shape: 'square',
    lines: ['Geography, Earth', '& Environmental', 'Sciences'],
    fontSize: 10.65,
    lineHeight: 11.45,
    capTop: 105.8,
    source: SUPPLIED
  },
  {
    text: 'Faculty of Science & Engineering',
    shape: 'square',
    lines: ['Faculty of Science', '& Engineering'],
    fontSize: 12.5,
    lineHeight: 12,
    capTop: 107.9,
    source: SUPPLIED
  },
  {
    text: 'Student Life',
    shape: 'square',
    lines: ['Student Life'],
    fontSize: 13.15,
    lineHeight: 15,
    capTop: 109,
    source: GSM_2020
  },
  {
    text: 'MBA',
    shape: 'square',
    lines: ['MBA'],
    fontSize: 14.5,
    lineHeight: 15,
    capTop: 118.5,
    source: GSM_2020
  },
  {
    text: 'Wood Engineering',
    shape: 'circle',
    lines: ['Wood', 'Engineering'],
    fontSize: 17.6,
    lineHeight: 19.3,
    capTop: 83.8,
    source: GSM_2020
  },
  {
    text: 'Graduate Programs',
    shape: 'circle',
    lines: ['Graduate', 'Programs'],
    fontSize: 17.6,
    lineHeight: 19.7,
    capTop: 90.2,
    source: GSM_2020
  }
]

/** The locked caption for a name in a layout shape, or null when that avatar hasn't been measured. */
export const findLockedProfile = (text, shape = 'square') => {
  if (/\r?\n/.test(text)) return null
  const name = text.replace(/\s+/g, ' ').trim()
  return LOCKED_PROFILES.find((entry) => entry.text === name && entry.shape === shape) || null
}
