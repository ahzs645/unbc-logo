import React, { useMemo, useState } from 'react'
import {
  BRAND_COLORS,
  SIZE_PRESETS,
  buildFileName,
  exportLogo,
  measureDepartmentText,
  renderLogoSvg,
  resolveColor,
  splitDepartmentText,
  DEPARTMENT_LINE
} from '../index.js'
import {
  ColorField,
  DepartmentField,
  ExportActions,
  FormatField,
  StatusNotice,
  useColorChoice,
  useStatus
} from './controls.jsx'
import { DepartmentPicker } from './DepartmentPicker.jsx'

// This site builds the wordmark lockup only. The Alumni crest is a separate mark with its own
// usage rules, so it is deliberately not offered here for free recolouring and download —
// renderCrestSvg() and <AlumniCrest> remain available to apps that need it.

const COLOR_CHOICES = [
  { value: 'white', label: 'White', swatch: BRAND_COLORS.white },
  { value: 'black', label: 'Black', swatch: BRAND_COLORS.black },
  { value: 'green', label: 'Green', swatch: BRAND_COLORS.green }
]

const BACKGROUND_CHOICES = [
  { value: 'none', label: 'Transparent', swatch: null },
  { value: 'green', label: 'Green', swatch: BRAND_COLORS.green },
  { value: 'white', label: 'White', swatch: BRAND_COLORS.white },
  { value: 'black', label: 'Black', swatch: BRAND_COLORS.black }
]

export const LogoGenerator = ({ departmentText, setDepartmentText }) => {
  const [padding, setPadding] = useState(8)
  const [square, setSquare] = useState(false)
  const [format, setFormat] = useState('svg')
  const [pixelWidth, setPixelWidth] = useState(1024)
  const [status, setStatus] = useStatus()

  const logoColor = useColorChoice('white')
  const departmentColor = useColorChoice('match')
  const background = useColorChoice('green')

  const lines = useMemo(() => splitDepartmentText(departmentText), [departmentText])

  // A single word longer than the lockup cannot be wrapped, so it will overhang the artwork.
  // Surfacing it is more useful than silently clipping or shrinking it.
  const overflowing = useMemo(
    () => lines.filter((line) => measureDepartmentText(line) > DEPARTMENT_LINE.maxWidth),
    [lines]
  )

  const svgOptions = useMemo(() => ({
    departmentText,
    color: logoColor.value,
    // 'match' means "follow the logo colour" — pass nothing and let the renderer default.
    departmentColor: departmentColor.choice === 'match' ? undefined : departmentColor.value,
    background: background.value,
    padding,
    square
  }), [departmentText, logoColor.value, departmentColor.choice, departmentColor.value,
    background.value, padding, square])

  const previewSvg = useMemo(() => renderLogoSvg(svgOptions), [svgOptions])

  const fileName = buildFileName({ ...svgOptions, format })

  // A transparent export of a white mark is technically correct but looks blank in most viewers.
  const invisibleWarning = background.choice === 'none' &&
    resolveColor(logoColor.value).toLowerCase() === '#ffffff'

  return (
    <main className="layout">
      <section className="panel" aria-label="Lockup preview">
        <div
          className={`stage${background.choice === 'none' ? ' stage--checker' : ''}`}
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
        <div className="stage-meta">
          <span>
            {lines.length || 'No'} department line{lines.length === 1 ? '' : 's'}
          </span>
          <code>{fileName}</code>
        </div>
        {overflowing.length > 0 && (
          <p className="notice notice--warn">
            “{overflowing[0]}” is a single word wider than the lockup and will overhang.
            Add a line break or shorten it.
          </p>
        )}
        {invisibleWarning && (
          <p className="notice notice--warn">
            A white mark on a transparent background will look blank in most previewers.
            It is still correct — place it on a dark ground.
          </p>
        )}
      </section>

      <section className="panel controls" aria-label="Lockup options">
        <DepartmentPicker id="department-picker" value={departmentText} onChange={setDepartmentText} />
        <DepartmentField
          id="department"
          value={departmentText}
          onChange={setDepartmentText}
          hint={`Wraps automatically at ${DEPARTMENT_LINE.maxWidth} units. Press Enter to force a line break.`}
        />

        <ColorField label="Logo colour" choices={COLOR_CHOICES} control={logoColor} />
        <ColorField
          label="Department text colour"
          choices={COLOR_CHOICES}
          control={departmentColor}
          extraChoices={[{ value: 'match', label: 'Match logo', swatch: undefined }]}
        />
        <ColorField label="Background" choices={BACKGROUND_CHOICES} control={background} />

        <div className="field">
          <span className="field__label">Canvas</span>
          <div className="chips">
            {[{ value: false, label: 'Fit to lockup' }, { value: true, label: 'Square' }].map((option) => (
              <button
                key={option.label}
                type="button"
                className={`chip${square === option.value ? ' chip--on' : ''}`}
                onClick={() => setSquare(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="padding">
            Padding <span className="count">{padding}</span>
          </label>
          <input
            id="padding"
            type="range"
            min="0"
            max="40"
            value={padding}
            onChange={(event) => setPadding(Number(event.target.value))}
          />
        </div>

        <FormatField
          format={format}
          setFormat={setFormat}
          pixelWidth={pixelWidth}
          setPixelWidth={setPixelWidth}
          sizes={SIZE_PRESETS}
          sizeLabel={square ? 'Size' : 'Width'}
          formatSize={(size) => (square ? `${size}×${size}` : `${size}px`)}
        />

        <ExportActions
          format={format}
          svg={previewSvg}
          setStatus={setStatus}
          onExport={() => exportLogo({ ...svgOptions, format, pixelWidth })}
        />
        <StatusNotice status={status} />
      </section>
    </main>
  )
}
