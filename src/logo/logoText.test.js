import assert from 'node:assert/strict'
import test from 'node:test'
import { departmentTypes } from '../departments/departmentData.js'
import { LOCKED_LOCKUPS } from './lockedLockups.js'
import {
  DEPARTMENT_LINE,
  measureDepartmentText,
  splitDepartmentText,
  wrapDepartmentText
} from './logoText.js'

const collectDepartmentNames = (value, names = new Set()) => {
  if (Array.isArray(value)) {
    value.forEach((name) => names.add(name))
    return names
  }

  if (!value || typeof value !== 'object') return names

  Object.entries(value).forEach(([key, child]) => {
    if (key !== 'name' && key !== 'departments') names.add(key)
    collectDepartmentNames(child, names)
  })

  return names
}

test('wraps the Faculty of Indigenous Studies lockup like the brand reference', () => {
  assert.deepEqual(
    splitDepartmentText('Faculty of Indigenous Studies, Social Sciences and Humanities'),
    [
      'Faculty of Indigenous',
      'Studies, Social Sciences',
      'and Humanities'
    ]
  )
})

test('wraps the Archives and Library lockups like their official sub-logos', () => {
  assert.deepEqual(
    splitDepartmentText('Northern BC Archives & Special Collections'),
    ['Northern BC Archives', '& Special Collections']
  )
  assert.deepEqual(splitDepartmentText('Geoffrey R. Weller Library'), ['Geoffrey R. Weller Library'])
})

test('never ends a lockup line on "and" or "&"', () => {
  ['Northern BC Archives & Special Collections', 'Research & Graduate Programs & Student Life & More',
    'Faculty of Human and Health Sciences', 'Faculty of Science and Engineering']
    .forEach((text) => {
      splitDepartmentText(text).forEach((line) => {
        assert.ok(!/(^|\s)(and|&)$/.test(line), `"${line}" from "${text}" ends on a conjunction`)
      })
    })
})

test('keeps a conjunction where carrying it down would overflow the next line', () => {
  // "and" + a word too wide to share a line with it: leave "and" where it is.
  const lines = wrapDepartmentText('Faculty of Human and Supercalifragilisticexpialidociousnessesesss')
  assert.deepEqual(lines, ['Faculty of Human and', 'Supercalifragilisticexpialidociousnessesesss'])
})

test('the wrapping rules alone reproduce every locked sub-logo', () => {
  LOCKED_LOCKUPS.forEach(({ text, lines, source }) => {
    assert.deepEqual(wrapDepartmentText(text), lines, `the rules break "${text}" differently from ${source}`)
  })
})

test('locked sub-logos fit the lockup and hold whatever the rules say', () => {
  LOCKED_LOCKUPS.forEach(({ text, lines }) => {
    lines.forEach((line) => assert.ok(measureDepartmentText(line) <= DEPARTMENT_LINE.maxWidth, `"${line}" overflows`))
    assert.deepEqual(splitDepartmentText(text), lines)
    // Extra spaces in the typed name still find the lock.
    assert.deepEqual(splitDepartmentText(`  ${text.replace(/ /g, '  ')} `), lines)
  })
})

test('the lock gives way to a hand-made break and to other widths', () => {
  assert.deepEqual(splitDepartmentText('Faculty of Human and\nHealth Sciences'), ['Faculty of Human and', 'Health Sciences'])
  assert.deepEqual(splitDepartmentText('Faculty of Human and Health Sciences', 400), ['Faculty of Human and Health Sciences'])
})

test('keeps every configured department line within the logo lockup', () => {
  const departmentNames = collectDepartmentNames(departmentTypes)

  departmentNames.forEach((name) => {
    splitDepartmentText(name).forEach((line) => {
      const isSingleLongWord = !line.includes(' ')
      assert.ok(
        isSingleLongWord || measureDepartmentText(line) <= DEPARTMENT_LINE.maxWidth,
        `"${line}" from "${name}" exceeds the department lockup`
      )
    })
  })
})

test('preserves explicit line breaks and normalizes surrounding whitespace', () => {
  assert.deepEqual(
    splitDepartmentText('Faculty of Indigenous\n  Studies, Social Sciences and Humanities  '),
    ['Faculty of Indigenous', 'Studies, Social Sciences', 'and Humanities']
  )
})
