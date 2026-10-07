import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { departmentPresets } from '../departments/presets.js'
import { computeWrapSnapshot } from './wrapSnapshot.js'

const snapshot = JSON.parse(readFileSync(new URL('./departmentWraps.snapshot.json', import.meta.url), 'utf8'))

const ACCEPT = 'If every move is intended, run `npm run snapshot:wraps` and commit the snapshot with the change.'

test('no department line wraps differently from the committed snapshot', () => {
  const current = computeWrapSnapshot(Object.keys(snapshot))
  const moved = Object.keys(snapshot).flatMap((name) => {
    const was = snapshot[name]
    const now = current[name]
    const changes = []
    if (JSON.stringify(was.lockup) !== JSON.stringify(now.lockup)) {
      changes.push(`  lockup   "${name}"\n    was ${JSON.stringify(was.lockup)}\n    now ${JSON.stringify(now.lockup)}`)
    }
    ;['profile', 'profileCircle'].forEach((key) => {
      if (JSON.stringify(was[key]) !== JSON.stringify(now[key])) {
        changes.push(`  ${key}  "${name}"\n    was ${JSON.stringify(was[key])}\n    now ${JSON.stringify(now[key])}`)
      }
    })
    return changes
  })

  assert.ok(moved.length === 0, `${moved.length} department line(s) moved:\n${moved.join('\n')}\n${ACCEPT}`)
})

test('every preset is recorded in the snapshot', () => {
  const missing = departmentPresets.map((preset) => preset.label).filter((label) => !snapshot[label])
  assert.deepEqual(missing, [], `Not in the snapshot: ${missing.join(', ')}. ${ACCEPT}`)
})
