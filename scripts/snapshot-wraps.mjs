// Records how every known department line wraps, so a change to the wrapping rules shows up as a
// reviewable diff instead of silently re-breaking lockups that were already in use.
//
//   npm run snapshot:wraps     rewrite src/logo/departmentWraps.snapshot.json from the current rules
//
// `npm test` compares against the committed snapshot and names every line that moved. Run this
// only once those moves are intended, and commit the snapshot with the rule change.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { departmentPresets } from '../src/departments/presets.js'
import { LOCKED_LOCKUPS } from '../src/logo/lockedLockups.js'
import { computeWrapSnapshot } from '../src/logo/wrapSnapshot.js'

// Names printed on real door signs (UNBCDoor's data/door-sign-archive.json) that are not presets.
// They are part of what a rule change could move, so they are held to the snapshot too.
const DOOR_ARCHIVE_NAMES = [
  'Northern Undergraduate Student Society',
  "Northern BC Graduate Students' Society",
  'Student Life & Orientation',
  'Division of Medical Science',
  'Northern Medical Program',
  'Department of Physics'
]

const names = [...new Set([
  ...departmentPresets.map((preset) => preset.label),
  ...LOCKED_LOCKUPS.map((lockup) => lockup.text),
  ...DOOR_ARCHIVE_NAMES
])]

const target = fileURLToPath(new URL('../src/logo/departmentWraps.snapshot.json', import.meta.url))
writeFileSync(target, `${JSON.stringify(computeWrapSnapshot(names), null, 2)}\n`)
console.log(`Wrote ${names.length} department lines to ${target}`)
