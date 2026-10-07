import assert from 'node:assert/strict'
import test from 'node:test'
import { DEPARTMENT_LINE, measureDepartmentText } from '../logo/logoText.js'
import { departmentAlternateNames, departmentTypes } from './departmentData.js'
import { departmentPresetGroups, departmentPresets, searchDepartmentPresets } from './presets.js'

// An independent flat walk of the hierarchy, so the test does not lean on a magic count that
// would need editing every time a department is added.
const expectedLabels = () => {
  const labels = []

  Object.values(departmentTypes).forEach((typeData) => {
    Object.values(typeData.departments).forEach((mainData) => {
      Object.entries(mainData).forEach(([subName, subData]) => {
        labels.push(subName, ...(departmentAlternateNames[subName] || []))
        // Object children are named sub-units; array children are short aliases, not lockup names.
        if (subData && typeof subData === 'object' && !Array.isArray(subData)) {
          Object.keys(subData).forEach((subSubName) => {
            labels.push(subSubName, ...(departmentAlternateNames[subSubName] || []))
          })
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

test('the Library is offered by its full name first, then its short form', () => {
  const library = searchDepartmentPresets('library')
  // Label matches lead; the Archives follows as a path match, being part of the Library.
  assert.deepEqual(library.map((preset) => preset.label), [
    'Geoffrey R. Weller Library',
    'Library',
    'Northern BC Archives & Special Collections'
  ])
  assert.equal(library[1].alternateOf, 'Geoffrey R. Weller Library')
  assert.equal(library[1].sub, 'Geoffrey R. Weller Library')

  const [archives] = searchDepartmentPresets('archives')
  assert.equal(archives.label, 'Northern BC Archives & Special Collections')
  assert.equal(archives.sub, 'Geoffrey R. Weller Library')
})

test('Hospitality Services sits with the other operations units', () => {
  const [hospitality] = searchDepartmentPresets('hospitality')
  assert.equal(hospitality.label, 'Hospitality Services')
  assert.equal(hospitality.main, 'Vice-President, Finance and Administration')
  assert.deepEqual(hospitality.lines, ['Hospitality Services'])
})

test('the Health Research Institute sits with research, on one line', () => {
  const [institute] = searchDepartmentPresets('health research')
  assert.equal(institute.label, 'Health Research Institute')
  assert.equal(institute.main, 'Vice-President, Research and Innovation')
  assert.deepEqual(institute.lines, ['Health Research Institute'])
})

test('every alternate name belongs to a unit in the hierarchy', () => {
  const labels = new Set(expectedLabels())
  Object.keys(departmentAlternateNames).forEach((name) => assert.ok(labels.has(name), `${name} is not a unit`))
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
