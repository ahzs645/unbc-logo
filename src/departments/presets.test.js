import assert from 'node:assert/strict'
import test from 'node:test'
import { DEPARTMENT_LINE, measureDepartmentText } from '../logo/logoText.js'
import { departmentTypes } from './departmentData.js'
import { departmentPresetGroups, departmentPresets, searchDepartmentPresets } from './presets.js'

// An independent flat walk of the hierarchy, so the test does not lean on a magic count that
// would need editing every time a department is added.
const expectedLabels = () => {
  const labels = []

  Object.values(departmentTypes).forEach((typeData) => {
    Object.values(typeData.departments).forEach((mainData) => {
      Object.entries(mainData).forEach(([subName, subData]) => {
        labels.push(subName)
        // Object children are named sub-units; array children are short aliases, not lockup names.
        if (subData && typeof subData === 'object' && !Array.isArray(subData)) {
          labels.push(...Object.keys(subData))
        }
      })
    })
  })

  return labels
}

test('flattens every level of the hierarchy exactly once', () => {
  const expected = expectedLabels()

  assert.equal(departmentPresets.length, expected.length)
  assert.deepEqual(
    departmentPresets.map((preset) => preset.label).sort(),
    expected.sort()
  )
  assert.equal(new Set(departmentPresets.map((p) => p.id)).size, departmentPresets.length)
})

test('every preset carries a label, a path, and pre-wrapped lines', () => {
  departmentPresets.forEach((preset) => {
    assert.ok(preset.label, `preset ${preset.id} has no label`)
    assert.ok(preset.path.includes('›'), `preset ${preset.id} has no hierarchy path`)
    assert.ok(preset.lines.length >= 1, `preset ${preset.id} produced no lines`)
  })
})

test('the leaf alias arrays are not mistaken for sub-departments', () => {
  // "Psychology" is an alias under "Department of Psychology"; the lockup uses the formal name.
  const labels = departmentPresets.map((preset) => preset.label)
  assert.ok(labels.includes('Department of Psychology'))
  assert.ok(!labels.includes('Psychology'))
})

test('every preset wraps within the lockup', () => {
  departmentPresets.forEach((preset) => {
    preset.lines.forEach((line) => {
      const isSingleLongWord = !line.includes(' ')
      assert.ok(
        isSingleLongWord || measureDepartmentText(line) <= DEPARTMENT_LINE.maxWidth,
        `"${line}" from "${preset.label}" exceeds the lockup`
      )
    })
  })
})

test('search matches labels ahead of hierarchy paths', () => {
  const results = searchDepartmentPresets('engineering')

  assert.ok(results.length > 0)
  assert.ok(results[0].label.toLowerCase().includes('engineering'))
  assert.deepEqual(searchDepartmentPresets('  '), [])
})

test('groups partition the presets without loss', () => {
  const grouped = departmentPresetGroups.reduce((total, group) => total + group.presets.length, 0)
  assert.equal(grouped, departmentPresets.length)
})
