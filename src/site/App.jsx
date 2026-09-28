import React, { useState } from 'react'
import { LogoGenerator } from './LogoGenerator.jsx'
import { ProfileGenerator } from './ProfileGenerator.jsx'

const MODES = [
  {
    value: 'logo',
    label: 'Logo lockup',
    intro: 'Type a department, pick a colour, and export the lockup. Wrapping follows the brand ' +
      'rules from measured font metrics, so what you see is what prints.'
  },
  {
    value: 'profile',
    label: 'Social profile picture',
    intro: 'A square avatar for social accounts: the UNBC letters on green, with the department ' +
      'or group name underneath. Preview the circle crop most platforms apply before you export.'
  }
]

export const App = () => {
  const [mode, setMode] = useState('logo')
  // Shared, so switching generators keeps whatever department was typed.
  const [departmentText, setDepartmentText] = useState('School of Engineering')

  const current = MODES.find((option) => option.value === mode)
  const Generator = mode === 'profile' ? ProfileGenerator : LogoGenerator

  return (
    <div className="page">
      <header className="masthead">
        <h1>UNBC Logo Generator</h1>
        <div className="tabs" role="tablist" aria-label="Generator">
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={mode === option.value}
              className={`tab${mode === option.value ? ' tab--on' : ''}`}
              onClick={() => setMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p>{current.intro}</p>
      </header>

      <Generator departmentText={departmentText} setDepartmentText={setDepartmentText} />

      <footer className="footer">
        <p>
          Reusable as a git submodule — see the README for <code>renderLogoSvg()</code>,{' '}
          <code>renderProfileSvg()</code>, and the React components.
        </p>
      </footer>
    </div>
  )
}
