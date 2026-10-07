import React, { useEffect, useMemo, useState } from 'react'
import {
  EXPORT_FORMATS,
  EXPORT_FORMAT_ORDER,
  isFormatSupported
} from '../index.js'

// Controls shared by the lockup and profile-picture generators.

export const CUSTOM = 'custom'

// A colour control is either one of the named choices or a free-form hex value.
export const useColorChoice = (initial, initialCustom = '#c2952d') => {
  const [choice, setChoice] = useState(initial)
  const [custom, setCustom] = useState(initialCustom)
  const value = choice === CUSTOM ? custom : choice
  return { choice, setChoice, custom, setCustom, value }
}

export const Swatch = ({ color }) => (
  color
    ? <span className="swatch" style={{ background: color }} aria-hidden="true" />
    : <span className="swatch swatch--transparent" aria-hidden="true" />
)

export const ColorField = ({ label, choices, control, extraChoices = [] }) => (
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

export const DepartmentField = ({ id, value, onChange, hint }) => (
  <div className="field">
    <label className="field__label" htmlFor={id}>Department line</label>
    <textarea
      id={id}
      className="input input--area"
      rows={3}
      value={value}
      placeholder="School of Engineering"
      onChange={(event) => onChange(event.target.value)}
    />
    <p className="hint">{hint}</p>
  </div>
)

export const FormatField = ({
  format,
  setFormat,
  pixelWidth,
  setPixelWidth,
  sizes,
  sizeLabel = 'Width',
  formatSize = (size) => `${size}px`
}) => {
  const supported = useMemo(
    () => Object.fromEntries(EXPORT_FORMAT_ORDER.map((key) => [key, isFormatSupported(key)])),
    []
  )

  return (
    <>
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
          <span className="field__label">{sizeLabel}</span>
          <div className="chips">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`chip${pixelWidth === size ? ' chip--on' : ''}`}
                onClick={() => setPixelWidth(size)}
              >
                {formatSize(size)}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// A transient status line that clears itself after a few seconds.
export const useStatus = () => {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!status) return undefined
    const timer = setTimeout(() => setStatus(null), 4000)
    return () => clearTimeout(timer)
  }, [status])

  return [status, setStatus]
}

export const StatusNotice = ({ status }) => status && (
  <p className={`notice notice--${status.tone === 'ok' ? 'ok' : 'warn'}`}>
    {status.message}
  </p>
)

// Download and copy-SVG buttons, with the busy state and status reporting both generators need.
export const ExportActions = ({ format, onExport, svg, setStatus }) => {
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    setBusy(true)
    try {
      const saved = await onExport()
      setStatus({ tone: 'ok', message: `Saved ${saved}` })
    } catch (error) {
      setStatus({ tone: 'bad', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svg)
      setStatus({ tone: 'ok', message: 'SVG markup copied to clipboard' })
    } catch (error) {
      setStatus({ tone: 'bad', message: `Could not copy: ${error.message}` })
    }
  }

  return (
    <div className="actions">
      <button type="button" className="button" disabled={busy} onClick={handleExport}>
        {busy ? 'Exporting…' : `Download ${EXPORT_FORMATS[format].label}`}
      </button>
      <button type="button" className="button button--ghost" onClick={handleCopySvg}>
        Copy SVG
      </button>
    </div>
  )
}
