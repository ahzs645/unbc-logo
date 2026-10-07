// Department lines checked against UNBC's own sub-logo artwork, and locked to it.
//
// The wrapping rules in logoText.js reproduce every one of these, and the tests hold them to it.
// The lock goes further: on the lockup, these names always break exactly as listed here, so a
// later change to the rules cannot move a line that has already been matched to the real
// artwork. Add an entry whenever a new official sub-logo turns up, with where it came from.
//
// The lock applies only at the lockup's own width, and only to the name as written — a line
// broken by hand, or wrapped wider (the door sign's 'band' mode) or narrower (profile captions),
// still follows the rules.

const GSM_2020 = 'Graphics Standards Manual (Feb 2020), p. 5 — unbc.ca/communications-and-marketing/unbc-visual-identity'
const SUPPLIED = 'Official sub-logo artwork supplied for this kit (Oct 2026)'

export const LOCKED_LOCKUPS = [
  { text: 'Office of Research', lines: ['Office of Research'], source: GSM_2020 },
  { text: 'Northwest', lines: ['Northwest'], source: GSM_2020 },
  {
    text: 'School of Business',
    lines: ['School of Business'],
    source: 'unbc.ca/sites/default/files/continuing-studies/cs-course/2025/sublogoschoolofbusinessblack.png'
  },
  {
    text: 'Library',
    lines: ['Library'],
    source: 'unbc.ca/sites/default/files/sections/library/sublogolibrarywhite.png'
  },
  { text: 'Geoffrey R. Weller Library', lines: ['Geoffrey R. Weller Library'], source: SUPPLIED },
  {
    text: 'Northern BC Archives & Special Collections',
    lines: ['Northern BC Archives', '& Special Collections'],
    source: 'SubLogo_Archives_GREEN.png, used by search.nbca.unbc.ca'
  },
  { text: 'Hospitality Services', lines: ['Hospitality Services'], source: SUPPLIED },
  { text: 'Health Research Institute', lines: ['Health Research Institute'], source: SUPPLIED },
  {
    text: 'Faculty of Human and Health Sciences',
    lines: ['Faculty of Human', 'and Health Sciences'],
    source: SUPPLIED
  },
  { text: 'School of Social Work', lines: ['School of Social Work'], source: SUPPLIED },
  { text: 'Career Centre', lines: ['Career Centre'], source: SUPPLIED },
  {
    text: 'Faculty of Indigenous Studies, Social Sciences and Humanities',
    lines: ['Faculty of Indigenous', 'Studies, Social Sciences', 'and Humanities'],
    source: SUPPLIED
  },
  { text: 'Faculty of Environment', lines: ['Faculty of Environment'], source: SUPPLIED },
  {
    text: 'Northern Analytical Laboratory Services',
    lines: ['Northern Analytical', 'Laboratory Services'],
    source: 'Official NALS sub-logo artwork supplied for this kit (Oct 2026); also the UNBCDoor production door-sign artboards'
  }
]

const byText = new Map(LOCKED_LOCKUPS.map((lockup) => [lockup.text, lockup]))

/** The locked lines for a department name, or null when it has not been matched to artwork. */
export const findLockedLines = (text) => {
  const lockup = byText.get(text.replace(/\s+/g, ' ').trim())
  return lockup ? [...lockup.lines] : null
}
