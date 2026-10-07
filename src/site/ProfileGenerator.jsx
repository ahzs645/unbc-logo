import React, { useMemo, useState } from 'react'
import {
  BRAND_COLORS,
  PROFILE_COLORS,
  PROFILE_SIZE_PRESETS,
  buildFileName,
  exportLogo,
  findCircleCropOverflow,
  layoutProfileCaption,
  renderProfileSvg
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

const PANEL_CHOICES = [
  { value: 'gradient', label: 'Green glow', swatch: PROFILE_COLORS.glow },
  { value: 'green', label: 'Flat green', swatch: BRAND_COLORS.green },
  { value: 'black', label: 'Black', swatch: BRAND_COLORS.black }
]

const MARK_CHOICES = [
  { value: 'white', label: 'White', swatch: BRAND_COLORS.white },
  { value: 'black', label: 'Black', swatch: BRAND_COLORS.black }
]

const CAPTION_CHOICES = [
  { value: PROFILE_COLORS.caption, label: 'Deep green', swatch: PROFILE_COLORS.caption },
  { value: 'green', label: 'Green', swatch: BRAND_COLORS.green },
  { value: 'black', label: 'Black', swatch: BRAND_COLORS.black }
]

const BAND_CHOICES = [
  { value: 'white', label: 'White', swatch: BRAND_COLORS.white },
  { value: 'black', label: 'Black', swatch: BRAND_COLORS.black }
]

const CROPS = [
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle crop' }
]

export const ProfileGenerator = ({ departmentText, setDepartmentText }) => {
  const [format, setFormat] = useState('png')
  const [pixelWidth, setPixelWidth] = useState(800)
  const [crop, setCrop] = useState('square')
  const [status, setStatus] = useStatus()

  const panel = useColorChoice('gradient')
  const markColor = useColorChoice('white')
  const textColor = useColorChoice(PROFILE_COLORS.caption)
  const bandColor = useColorChoice('white', '#f3efe4')

  const svgOptions = useMemo(() => ({
    mark: 'profile',
    departmentText,
    background: panel.value,
    markColor: markColor.value,
    textColor: textColor.value,
    bandColor: bandColor.value
  }), [departmentText, panel.value, markColor.value, textColor.value, bandColor.value])

  const previewSvg = useMemo(() => renderProfileSvg(svgOptions), [svgOptions])
  const layout = useMemo(() => layoutProfileCaption(departmentText), [departmentText])
  const clipped = useMemo(() => findCircleCropOverflow(departmentText), [departmentText])

  const fileName = buildFileName({ ...svgOptions, format })

  return (
    <main className="layout">
      <section className="panel" aria-label="Profile picture preview">
        <div className="stage stage--profile">
          <div
            className={`avatar${crop === 'circle' ? ' avatar--circle' : ''}`}
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
          <div
            className={`avatar avatar--small${crop === 'circle' ? ' avatar--circle' : ''}`}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        </div>
        <div className="stage-meta">
          <span>
            {layout.lines.length || 'No'} caption line{layout.lines.length === 1 ? '' : 's'}
            {layout.shrunk && ` · shrunk to fit`}
          </span>
          <code>{fileName}</code>
        </div>
        {clipped.length > 0 && (
          <p className="notice notice--warn">
            Platforms that crop avatars to a circle will clip “{clipped[0]}”. Try a shorter
            name, or break the lines differently.
          </p>
        )}
      </section>

      <section className="panel controls" aria-label="Profile picture options">
        <DepartmentPicker id="profile-department-picker" value={departmentText} onChange={setDepartmentText} />
        <DepartmentField
          id="profile-department"
          value={departmentText}
          onChange={setDepartmentText}
          hint="Centred under the logo. Long names wrap and shrink to fit; press Enter to force a line break."
        />

        <div className="field">
          <span className="field__label">Preview</span>
          <div className="chips">
            {CROPS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip${crop === option.value ? ' chip--on' : ''}`}
                onClick={() => setCrop(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="hint">Preview only — the download is always the full square.</p>
        </div>

        <ColorField label="Panel" choices={PANEL_CHOICES} control={panel} />
        <ColorField label="Logo colour" choices={MARK_CHOICES} control={markColor} />
        <ColorField label="Caption band" choices={BAND_CHOICES} control={bandColor} />
        <ColorField label="Caption colour" choices={CAPTION_CHOICES} control={textColor} />

        <FormatField
          format={format}
          setFormat={setFormat}
          pixelWidth={pixelWidth}
          setPixelWidth={setPixelWidth}
          sizes={PROFILE_SIZE_PRESETS}
          sizeLabel="Size"
          formatSize={(size) => `${size}×${size}`}
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
