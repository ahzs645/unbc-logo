import assert from 'node:assert/strict'
import test from 'node:test'
import { departmentTypes } from '../departments/departmentData.js'
import {
  DEPARTMENT_LINE,
  measureDepartmentText,
  splitDepartmentText
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
