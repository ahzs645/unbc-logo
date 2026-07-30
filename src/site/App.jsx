import React, { useEffect, useMemo, useState } from 'react'
import {
  BRAND_COLORS,
  EXPORT_FORMATS,
  EXPORT_FORMAT_ORDER,
  SIZE_PRESETS,
  buildFileName,
  departmentPresets,
  exportLogo,
  isFormatSupported,
  measureDepartmentText,
  renderLogoSvg,
  resolveColor,
  searchDepartmentPresets,
  splitDepartmentText,
  DEPARTMENT_LINE
} from '../index.js'

// This site builds the wordmark lockup only. The Alumni crest is a separate mark with its own
// usage rules, so it is deliberately not offered here for free recolouring and download —
// renderCrestSvg() and <AlumniCrest> remain available to apps that need it.

const CUSTOM = 'custom'

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

// A colour control is either one of the named brand variants or a free-form hex value.
const useColorChoice = (initial) => {
  const [choice, setChoice] = useState(initial)
  const [custom, setCustom] = useState('#c2952d')
  const value = choice === CUSTOM ? custom : choice
  return { choice, setChoice, custom, setCustom, value }
}

const Swatch = ({ color }) => (
  color
    ? <span className="swatch" style={{ background: color }} aria-hidden="true" />
    : <span className="swatch swatch--transparent" aria-hidden="true" />
)

const ColorField = ({ label, choices, control, extraChoices = [] }) => (
  <div className="field">
    <span className="field__label">{label}</span>
    <div className="chips">
      {[...extraChoices, ...choices].map((option) => (
        <button
          key={option.value}
          type="button"
          className={`chip${control.choice === option.value ? ' chip--on' : ''}`}
          onClick={() => control.setChoice(option.value)}
        >
          {option.swatch !== undefined && <Swatch color={option.swatch} />}
          {option.label}
        </button>
      ))}
      <button
        type="button"
        className={`chip${control.choice === CUSTOM ? ' chip--on' : ''}`}
        onClick={() => control.setChoice(CUSTOM)}
      >
        <Swatch color={control.custom} />
        Custom
      </button>
    </div>
    {control.choice === CUSTOM && (
      <div className="custom-color">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(control.custom) ? control.custom : '#c2952d'}
          onChange={(event) => control.setCustom(event.target.value)}
          aria-label={`${label} colour picker`}
        />
        <input
          type="text"
          className="input input--hex"
          value={control.custom}
          onChange={(event) => control.setCustom(event.target.value)}
          spellCheck="false"
          aria-label={`${label} hex value`}
        />
      </div>
    )}
  </div>
)

export const App = () => {
  const [departmentText, setDepartmentText] = useState('School of Engineering')
  const [search, setSearch] = useState('')
  const [padding, setPadding] = useState(8)
  const [format, setFormat] = useState('svg')
  const [pixelWidth, setPixelWidth] = useState(1024)
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  const logoColor = useColorChoice('white')
  const departmentColor = useColorChoice('match')
  const background = useColorChoice('green')

  const results = useMemo(() => searchDepartmentPresets(search, 12), [search])

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
    padding
  }), [departmentText, logoColor.value, departmentColor.choice, departmentColor.value,
    background.value, padding])

  const previewSvg = useMemo(() => renderLogoSvg(svgOptions), [svgOptions])

  const fileName = buildFileName({ ...svgOptions, format })

  const supported = useMemo(
    () => Object.fromEntries(EXPORT_FORMAT_ORDER.map((key) => [key, isFormatSupported(key)])),
    []
  )

  // A transparent export of a white mark is technically correct but looks blank in most viewers.
  const invisibleWarning = background.choice === 'none' &&
    resolveColor(logoColor.value).toLowerCase() === '#ffffff'

  useEffect(() => {
    if (!status) return undefined
    const timer = setTimeout(() => setStatus(null), 4000)
    return () => clearTimeout(timer)
  }, [status])

  const handleExport = async () => {
    setBusy(true)
    try {
      const saved = await exportLogo({ ...svgOptions, format, pixelWidth })
      setStatus({ tone: 'ok', message: `Saved ${saved}` })
    } catch (error) {
      setStatus({ tone: 'bad', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(previewSvg)
      setStatus({ tone: 'ok', message: 'SVG markup copied to clipboard' })
    } catch (error) {
      setStatus({ tone: 'bad', message: `Could not copy: ${error.message}` })
    }
  }

  return (
    <div className="page">
      <header className="masthead">
        <h1>UNBC Logo Generator</h1>
        <p>
          Type a department, pick a colour, and export the lockup. Wrapping follows the brand
          rules from measured font metrics, so what you see is what prints.
        </p>
      </header>

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
          <div className="field">
            <label className="field__label" htmlFor="department">Department line</label>
            <textarea
              id="department"
              className="input input--area"
              rows={3}
              value={departmentText}
              placeholder="School of Engineering"
              onChange={(event) => setDepartmentText(event.target.value)}
            />
            <p className="hint">
              Wraps automatically at {DEPARTMENT_LINE.maxWidth} units. Press Enter to force
              a line break.
            </p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="preset-search">
              Department presets <span className="count">{departmentPresets.length}</span>
            </label>
            <input
              id="preset-search"
              type="search"
              className="input"
              value={search}
              placeholder="Search faculties, schools, departments…"
              onChange={(event) => setSearch(event.target.value)}
            />
            {search.trim() && (
              <ul className="results">
                {results.length === 0 && <li className="results__empty">No match</li>}
                {results.map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      className="result"
                      onClick={() => {
                        setDepartmentText(preset.label)
                        setSearch('')
                      }}
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

          <ColorField label="Logo colour" choices={COLOR_CHOICES} control={logoColor} />
          <ColorField
            label="Department text colour"
            choices={COLOR_CHOICES}
            control={departmentColor}
            extraChoices={[{ value: 'match', label: 'Match logo', swatch: undefined }]}
          />
          <ColorField label="Background" choices={BACKGROUND_CHOICES} control={background} />

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

          <div className="field">
            <span className="field__label">Format</span>
            <div className="chips">
              {EXPORT_FORMAT_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled={!supported[key]}
                  title={supported[key] ? undefined : 'This browser cannot encode this format'}
                  className={`chip${format === key ? ' chip--on' : ''}`}
                  onClick={() => setFormat(key)}
                >
                  {EXPORT_FORMATS[key].label}
                </button>
              ))}
            </div>
          </div>

          {!EXPORT_FORMATS[format].vector && (
            <div className="field">
              <span className="field__label">Width</span>
              <div className="chips">
                {SIZE_PRESETS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`chip${pixelWidth === size ? ' chip--on' : ''}`}
                    onClick={() => setPixelWidth(size)}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="actions">
            <button type="button" className="button" disabled={busy} onClick={handleExport}>
              {busy ? 'Exporting…' : `Download ${EXPORT_FORMATS[format].label}`}
            </button>
            <button type="button" className="button button--ghost" onClick={handleCopySvg}>
              Copy SVG
            </button>
          </div>

          {status && (
            <p className={`notice notice--${status.tone === 'ok' ? 'ok' : 'warn'}`}>
              {status.message}
            </p>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>
          Reusable as a git submodule — see the README for <code>renderLogoSvg()</code> and the
          React components.
        </p>
      </footer>
    </div>
  )
}
