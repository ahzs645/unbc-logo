import assert from 'node:assert/strict'
import test from 'node:test'
import { departmentTypes } from './departmentData.js'
import {
  departmentChildren,
  findDepartmentPath,
  fullDepartmentName,
  resolveDepartmentPath,
  selectDepartmentLevel
} from './departmentPath.js'

const PAYROLL_PATH = [
  'administrative',
  'Vice-President, Finance and Administration',
  'Financial Services',
  'Payroll Services'
]

test('lists the choices one level down, and nothing under a leaf', () => {
  assert.deepEqual(departmentChildren(departmentTypes, []), ['academic', 'administrative'])
  assert.ok(departmentChildren(departmentTypes, PAYROLL_PATH.slice(0, 3)).includes(PAYROLL_PATH[3]))
  assert.deepEqual(departmentChildren(departmentTypes, PAYROLL_PATH), [])
  assert.deepEqual(departmentChildren(departmentTypes, ['administrative', 'President', 'Athletics']), [])
})

test('finds a department saved by its name alone', () => {
  assert.deepEqual(findDepartmentPath(departmentTypes, 'Payroll Services'), PAYROLL_PATH)
  assert.deepEqual(resolveDepartmentPath(departmentTypes, { mainDepartment: 'Payroll Services' }), {
    path: PAYROLL_PATH,
    custom: ''
  })
  assert.equal(findDepartmentPath(departmentTypes, 'administrative'), null)
})

test('keeps a full path as stored, and reports a name that is not in the list', () => {
  const selection = selectDepartmentLevel(PAYROLL_PATH, 3, PAYROLL_PATH[3])
  assert.deepEqual(resolveDepartmentPath(departmentTypes, selection), { path: PAYROLL_PATH, custom: '' })
  assert.deepEqual(resolveDepartmentPath(departmentTypes, { departmentType: 'academic' }), { path: ['academic'], custom: '' })
  assert.deepEqual(resolveDepartmentPath(departmentTypes, { mainDepartment: 'Northern Medical Program' }), {
    path: [],
    custom: 'Northern Medical Program'
  })
  assert.deepEqual(resolveDepartmentPath(departmentTypes, {}), { path: [], custom: '' })
})

test('choosing a level keeps the ones above and clears the ones below', () => {
  assert.deepEqual(selectDepartmentLevel(PAYROLL_PATH, 2, 'Human Resources'), {
    departmentType: 'administrative',
    mainDepartment: 'Vice-President, Finance and Administration',
    subDepartment: 'Human Resources',
    subSubDepartment: ''
  })
  assert.deepEqual(selectDepartmentLevel(PAYROLL_PATH, 3, ''), {
    departmentType: 'administrative',
    mainDepartment: 'Vice-President, Finance and Administration',
    subDepartment: 'Financial Services',
    subSubDepartment: ''
  })
})

test('a short-form name leads back to its full unit', () => {
  assert.equal(fullDepartmentName('Library'), 'Geoffrey R. Weller Library')
  assert.equal(fullDepartmentName('School of Business'), 'School of Business')
  assert.deepEqual(findDepartmentPath(departmentTypes, fullDepartmentName('Library')), [
    'academic',
    'Provost and Vice-President, Academic',
    'Geoffrey R. Weller Library'
  ])
})

test('every name in the hierarchy is unique, so a name alone finds its unit', () => {
  const seen = new Map()
  const walk = (path) => departmentChildren(departmentTypes, path).forEach((child) => {
    const next = [...path, child]
    if (path.length > 0) {
      assert.ok(!seen.has(child), `"${child}" appears under both ${seen.get(child)} and ${path.join(' › ')}`)
      seen.set(child, path.join(' › '))
    }
    walk(next)
  })
  walk([])
})

test('Northern Analytical Laboratory Services sits with the Provost, as UNBC lists it', () => {
  assert.deepEqual(findDepartmentPath(departmentTypes, 'Northern Analytical Laboratory Services'), [
    'academic',
    'Provost and Vice-President, Academic',
    'Northern Analytical Laboratory Services'
  ])
})
