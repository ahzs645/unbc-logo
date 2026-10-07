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

const NALS_PATH = [
  'administrative',
  'Vice-President, Research and Innovation',
  'Office of Research and Innovation',
  'Northern Analytical Laboratory Services'
]

test('lists the choices one level down, and nothing under a leaf', () => {
  assert.deepEqual(departmentChildren(departmentTypes, []), ['academic', 'administrative'])
  assert.ok(departmentChildren(departmentTypes, NALS_PATH.slice(0, 3)).includes(NALS_PATH[3]))
  assert.deepEqual(departmentChildren(departmentTypes, NALS_PATH), [])
  assert.deepEqual(departmentChildren(departmentTypes, ['administrative', 'President', 'Athletics']), [])
})

test('finds a department saved by its name alone', () => {
  assert.deepEqual(findDepartmentPath(departmentTypes, 'Northern Analytical Laboratory Services'), NALS_PATH)
  assert.deepEqual(resolveDepartmentPath(departmentTypes, { mainDepartment: 'Northern Analytical Laboratory Services' }), {
    path: NALS_PATH,
    custom: ''
  })
  assert.equal(findDepartmentPath(departmentTypes, 'administrative'), null)
})

test('keeps a full path as stored, and reports a name that is not in the list', () => {
  const selection = selectDepartmentLevel(NALS_PATH, 3, NALS_PATH[3])
  assert.deepEqual(resolveDepartmentPath(departmentTypes, selection), { path: NALS_PATH, custom: '' })
  assert.deepEqual(resolveDepartmentPath(departmentTypes, { departmentType: 'academic' }), { path: ['academic'], custom: '' })
  assert.deepEqual(resolveDepartmentPath(departmentTypes, { mainDepartment: 'Northern Medical Program' }), {
    path: [],
    custom: 'Northern Medical Program'
  })
  assert.deepEqual(resolveDepartmentPath(departmentTypes, {}), { path: [], custom: '' })
})

test('choosing a level keeps the ones above and clears the ones below', () => {
  assert.deepEqual(selectDepartmentLevel(NALS_PATH, 2, 'Development'), {
    departmentType: 'administrative',
    mainDepartment: 'Vice-President, Research and Innovation',
    subDepartment: 'Development',
    subSubDepartment: ''
  })
  assert.deepEqual(selectDepartmentLevel(NALS_PATH, 3, ''), {
    departmentType: 'administrative',
    mainDepartment: 'Vice-President, Research and Innovation',
    subDepartment: 'Office of Research and Innovation',
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
