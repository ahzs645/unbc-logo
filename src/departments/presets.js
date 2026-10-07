// Flattens the department hierarchy into a flat list of ready-to-use lockup presets.
//
// The hierarchy in departmentData.js is shaped for a drill-down selector, but a logo generator
// wants the opposite: one flat list of every name that could legitimately sit on a lockup, so it
// can be searched, sorted, and rendered as a gallery. This derives that list rather than
// maintaining a second copy, so adding a department in one place updates both.

import { departmentAlternateNames, departmentTypes } from './departmentData.js'
import { splitDepartmentText } from '../logo/logoText.js'

// The leaf arrays in the hierarchy are short aliases (e.g. ["Psychology"]), not lockup names —
// the lockup uses the full formal name of the level above.
const isAliasList = (value) => Array.isArray(value)

// A unit's shorter official names, each as its own preset straight after the full name. They keep
// the unit's place in the hierarchy (`alternateOf` names the full form), so picking "Library" still
// resolves to the Geoffrey R. Weller Library.
const alternatesOf = (preset) => (departmentAlternateNames[preset.label] || []).map((name) => ({
  ...preset,
  id: `${preset.id}#${name}`,
  label: name,
  alternateOf: preset.label,
  path: `${preset.path} (short form)`,
  lines: splitDepartmentText(name)
}))

/**
 * Every department name that can appear on a lockup, in hierarchy order.
 *
 * Each preset carries the pre-wrapped `lines` so a picker can show how many lines the lockup will
 * take without re-measuring, and `path` for disambiguating identically-named units.
 */
export const departmentPresets = Object.entries(departmentTypes).flatMap(([typeKey, typeData]) =>
  Object.entries(typeData.departments).flatMap(([mainName, mainData]) =>
    Object.entries(mainData).flatMap(([subName, subData]) => {
      const parent = {
        type: typeKey,
        typeName: typeData.name,
        main: mainName,
        sub: subName
      }

      const subPreset = {
        ...parent,
        id: `${typeKey}/${mainName}/${subName}`,
        label: subName,
        path: `${typeData.name} › ${mainName} › ${subName}`,
        lines: splitDepartmentText(subName)
      }
      const subPresets = [subPreset, ...alternatesOf(subPreset)]

      if (isAliasList(subData) || !subData || typeof subData !== 'object') return subPresets

      const children = Object.keys(subData).flatMap((subSubName) => {
        const preset = {
          ...parent,
          subSub: subSubName,
          id: `${typeKey}/${mainName}/${subName}/${subSubName}`,
          label: subSubName,
          path: `${typeData.name} › ${mainName} › ${subName} › ${subSubName}`,
          lines: splitDepartmentText(subSubName)
        }
        return [preset, ...alternatesOf(preset)]
      })

      return [...subPresets, ...children]
    })
  )
)

// Presets grouped by top-level type ('academic', 'administrative', …), for a sectioned picker.
export const departmentPresetGroups = Object.entries(departmentTypes).map(([typeKey, typeData]) => ({
  type: typeKey,
  name: typeData.name,
  presets: departmentPresets.filter((preset) => preset.type === typeKey)
}))

/** Case-insensitive substring search over preset labels and their full hierarchy path. */
export const searchDepartmentPresets = (query, limit = 20) => {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  const byLabel = []
  const byPath = []

  departmentPresets.forEach((preset) => {
    if (preset.label.toLowerCase().includes(needle)) byLabel.push(preset)
    else if (preset.path.toLowerCase().includes(needle)) byPath.push(preset)
  })

  // Label matches are what the user is almost always after; path matches are the fallback.
  return [...byLabel, ...byPath].slice(0, limit)
}
