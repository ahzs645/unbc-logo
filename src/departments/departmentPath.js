import { departmentAlternateNames } from './departmentData.js'
import { getDepartmentDisplayName } from './hierarchy.js'

// The department picker walks the hierarchy one level at a time: area (academic or
// administrative), portfolio, faculty or office, then department or unit. These helpers turn a
// stored selection into that path and back, so each level can offer its own choices.

export const DEPARTMENT_LEVELS = [
  { key: 'departmentType', label: 'Area' },
  { key: 'mainDepartment', label: 'Portfolio' },
  { key: 'subDepartment', label: 'Faculty / office' },
  { key: 'subSubDepartment', label: 'Department / unit' }
]

// The names one level down from a path, in the kit's order. The leaf arrays in the hierarchy
// are short aliases, not names, so a level whose value is an array has nothing under it.
export const departmentChildren = (departments, path) => {
  if (path.length === 0) return Object.keys(departments)
  let node = departments[path[0]]?.departments
  for (const name of path.slice(1)) {
    node = node?.[name]
    if (!node || Array.isArray(node)) return []
  }
  return node && typeof node === 'object' ? Object.keys(node) : []
}

export const departmentAreaName = (departments, key) => departments[key]?.name || key

// Every name in the hierarchy is unique, so a department saved by its name alone (as the
// production archive does) can be found again.
export const findDepartmentPath = (departments, name) => {
  if (!name) return null
  const search = (path) => {
    for (const child of departmentChildren(departments, path)) {
      const next = [...path, child]
      if (path.length > 0 && child === name) return next
      const found = search(next)
      if (found) return found
    }
    return null
  }
  return search([])
}

// Where a selection sits in the hierarchy. `custom` is a name that isn't in the kit's list; it
// still prints, but has no levels to choose between.
export const resolveDepartmentPath = (departments, selection = {}) => {
  const stored = DEPARTMENT_LEVELS.map(level => selection[level.key] || '')
  const filled = stored.findIndex(value => !value)
  const depth = filled < 0 ? stored.length : filled
  const path = stored.slice(0, depth)
  const valid = path.every((name, index) => departmentChildren(departments, path.slice(0, index)).includes(name))
  if (path.length && valid && stored.slice(depth).every(value => !value)) return { path, custom: '' }

  const name = getDepartmentDisplayName(selection)
  const found = findDepartmentPath(departments, name)
  return found ? { path: found, custom: '' } : { path: [], custom: name }
}

// The selection after choosing `value` at `depth` of `path`: the levels above are kept, the ones
// below are cleared (an empty value stops the path at the level above).
export const selectDepartmentLevel = (path, depth, value) => {
  const next = [...path.slice(0, depth), value].filter(Boolean)
  return Object.fromEntries(DEPARTMENT_LEVELS.map((level, index) => [level.key, next[index] || '']))
}

// The unit a short-form name stands for ("Library" → "Geoffrey R. Weller Library"), so a lockup
// set in its short form still finds its place in the hierarchy. Other names pass through.
export const fullDepartmentName = (name, alternates = departmentAlternateNames) =>
  Object.keys(alternates).find((full) => alternates[full].includes(name)) || name
