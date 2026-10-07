import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEPARTMENT_LEVELS,
  departmentAlternateNames,
  departmentAreaName,
  departmentChildren,
  departmentPresets,
  departmentTypes,
  findDepartmentPath,
  fullDepartmentName,
  getDepartmentDisplayName,
  searchDepartmentPresets,
  selectDepartmentLevel
} from '../index.js'

// The department, picked the way the door-sign generator picks it: a search across the whole
// list, and under it the chosen path, one level per line. Each level is a dropdown of the other
// choices at that level, so a lockup can move to a sibling unit (or stop a level higher) without
// searching again. Changing a level clears the ones below it; the deepest level chosen is the
// one the lockup prints.
//
// The department line itself stays the source of truth — it can still be typed or broken by
// hand — so the path shown here is worked out from it, and a name that isn't in the list is
// reported as custom rather than lost.

// Line breaks are only layout; a name broken across lines is still the same unit.
const normalizeName = (text) => text.replace(/\s+/g, ' ').trim()

// The name a path prints: its deepest level, unless that is only the area (academic or
// administrative), which is a grouping rather than a name.
const pathName = (path) => (path.length > 1 ? path[path.length - 1] : '')

const presetPath = (preset) => [preset.type, preset.main, preset.sub, preset.subSub].filter(Boolean)

export const DepartmentPicker = ({ id, value, onChange }) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  // The path last picked here. Several paths can print the same text (an area alone prints
  // nothing), so the picker remembers which one was meant while the text still agrees with it.
  const [picked, setPicked] = useState([])
  const searchRef = useRef(null)
  const results = useMemo(() => searchDepartmentPresets(query, 12), [query])

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!searchRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const name = normalizeName(value)
  const unitName = fullDepartmentName(name)
  const { path, custom } = useMemo(() => {
    if (picked.length && pathName(picked) === unitName) return { path: picked, custom: '' }
    const found = unitName ? findDepartmentPath(departmentTypes, unitName) : null
    return found ? { path: found, custom: '' } : { path: [], custom: name }
  }, [picked, unitName, name])

  const pickPath = (nextPath, text) => {
    setPicked(nextPath)
    onChange(text)
  }

  const choose = (preset) => {
    pickPath(presetPath(preset), preset.label)
    setQuery('')
    setOpen(false)
  }

  const chooseLevel = (depth, option) => {
    const selection = selectDepartmentLevel(path, depth, option)
    const nextPath = DEPARTMENT_LEVELS.map((level) => selection[level.key]).filter(Boolean)
    pickPath(nextPath, getDepartmentDisplayName(selection))
  }

  // A level shows once the one above it is chosen and has something under it; the first level
  // past the chosen path is offered as an optional next step.
  const levels = DEPARTMENT_LEVELS
    .map((level, depth) => ({
      ...level,
      depth,
      options: depth <= path.length ? departmentChildren(departmentTypes, path.slice(0, depth)) : []
    }))
    .filter((level) => level.options.length > 0)
  const printedDepth = pathName(path) ? path.length - 1 : -1

  // Units with an official short form ("Library") offer it beside the full name.
  const unit = pathName(path)
  const nameChoices = unit && departmentAlternateNames[unit] ? [unit, ...departmentAlternateNames[unit]] : []
  const hasSelection = path.length > 0 || Boolean(custom)

  return (
    <div className="field picker">
      <div className="picker__search" ref={searchRef}>
        <label className="field__label" htmlFor={id}>
          Department <span className="count">{departmentPresets.length}</span>
        </label>
        <input
          id={id}
          type="search"
          className="input"
          value={query}
          placeholder="Search faculties, schools, departments…"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(Boolean(event.target.value.trim()))
          }}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
            if (event.key === 'Enter' && open && results.length) {
              event.preventDefault()
              choose(results[0])
            }
          }}
        />
        {open && (
          <ul className="results picker__results" id={`${id}-results`} role="listbox">
            {results.length === 0 && <li className="results__empty">No departments match “{query.trim()}”</li>}
            {results.map((preset) => (
              <li key={preset.id} role="option" aria-selected="false">
                <button
                  type="button"
                  className="result"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(preset)}
                >
                  <span className="result__label">{preset.label}</span>
                  <span className="result__path">{preset.path}</span>
                  <span className="result__lines">
                    {preset.lines.length} line{preset.lines.length === 1 ? '' : 's'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="picker__levels">
        <div className="picker__header">
          <span className="picker__title">{hasSelection ? 'Selected department' : 'Or browse the list'}</span>
          {hasSelection && (
            <button type="button" className="picker__clear" onClick={() => pickPath([], '')}>
              Clear
            </button>
          )}
        </div>

        {custom && (
          <div className="level level--custom">
            <span className="level__label">
              Department <span className="level__badge">On logo</span>
            </span>
            <span className="level__custom">{custom}</span>
            <span className="level__note">Typed by hand, not in the UNBC list. Choose below to replace it.</span>
          </div>
        )}

        <ol className="levels">
          {levels.map(({ key, label, depth, options }) => {
            const selected = path[depth] || ''
            const optional = depth >= 2
            return (
              <li key={key} className="level" style={{ '--depth': depth }}>
                <label className="level__label" htmlFor={`${id}-${key}`}>
                  {label}
                  {depth === printedDepth && <span className="level__badge">On logo</span>}
                </label>
                <select
                  id={`${id}-${key}`}
                  className="input select"
                  value={selected}
                  onChange={(event) => chooseLevel(depth, event.target.value)}
                >
                  {(!selected || optional) && (
                    <option value="" disabled={!optional}>
                      {optional ? (selected ? 'None' : 'None — optional') : `Choose ${label.toLowerCase()}…`}
                    </option>
                  )}
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {depth === 0 ? departmentAreaName(departmentTypes, option) : option}
                    </option>
                  ))}
                </select>
              </li>
            )
          })}
        </ol>

        {nameChoices.length > 0 && (
          <div className="level level--names">
            <span className="level__label">Name on logo</span>
            <div className="chips">
              {nameChoices.map((choice, index) => (
                <button
                  key={choice}
                  type="button"
                  className={`chip${name === choice ? ' chip--on' : ''}`}
                  onClick={() => pickPath(path, choice)}
                >
                  {choice}
                  {index > 0 && <span className="chip__note">short</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
