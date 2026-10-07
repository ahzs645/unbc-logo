import React, { useMemo, useState } from 'react'
import {
  BRAND_COLORS,
  PROFILE_COLORS,
  PROFILE_SIZE_PRESETS,
  buildFileName,
  exportLogo,
  findCircleCropOverflow,
  layoutProfileCaption,
  profileCaptionText,
  profileLayout,
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

// The two setups in the Graphics Standards Manual (Feb 2020, p. 5): the square ("Student Life",
// "MBA"), and the circle drawn for platforms that crop to one ("Wood Engineering", "Graduate
// Programs") — smaller letters and a larger caption, all inside the circle.
const SHAPES = [
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' }
]

export const ProfileGenerator = ({ departmentText, setDepartmentText }) => {
  const [format, setFormat] = useState('png')
  const [pixelWidth, setPixelWidth] = useState(800)
  const [shape, setShape] = useState('square')
  // Shows how a platform's circular crop treats the square; the circle layout needs no preview.
  const [cropPreview, setCropPreview] = useState(false)
  const [status, setStatus] = useStatus()

  const panel = useColorChoice('gradient')
  const markColor = useColorChoice('white')
  const textColor = useColorChoice(PROFILE_COLORS.caption)
  const bandColor = useColorChoice('white', '#f3efe4')

  // The name the avatar prints: faculties mostly drop "Faculty of", as UNBC's own avatars do.
  const caption = profileCaptionText(departmentText)
  const renamed = caption !== departmentText

  const svgOptions = useMemo(() => ({
    mark: 'profile',
    shape,
    departmentText: caption,
    background: panel.value,
    markColor: markColor.value,
    textColor: textColor.value,
    bandColor: bandColor.value
  }), [shape, caption, panel.value, markColor.value, textColor.value, bandColor.value])

  const previewSvg = useMemo(() => renderProfileSvg(svgOptions), [svgOptions])
  const layout = useMemo(() => layoutProfileCaption(caption, profileLayout(shape)), [caption, shape])
  const clipped = useMemo(() => findCircleCropOverflow(caption, profileLayout(shape)), [caption, shape])
  // The circle layout is already round; rounding its frame too keeps the shadow off the corners.
  const cropped = shape === 'circle' || cropPreview

  const fileName = buildFileName({ ...svgOptions, format })

  return (
    <main className="layout">
      <section className="panel" aria-label="Profile picture preview">
        <div className="stage stage--profile">
          <div
            className={`avatar${cropped ? ' avatar--circle' : ''}`}
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
          <div
            className={`avatar avatar--small${cropped ? ' avatar--circle' : ''}`}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        </div>
        <div className="stage-meta">
          <span>
            {layout.lines.length || 'No'} caption line{layout.lines.length === 1 ? '' : 's'}
            {layout.shrunk && ` · shrunk to fit${shape === 'circle' ? ' the circle' : ''}`}
            {renamed && ` · prints as “${caption}”`}
          </span>
          <code>{fileName}</code>
        </div>
        {clipped.length > 0 && (
          <p className="notice notice--warn">
            Platforms that crop avatars to a circle will clip “{clipped[0]}”. Use the circle
            shape, try a shorter name, or break the lines differently.
          </p>
        )}
      </section>

      <section className="panel controls" aria-label="Profile picture options">
        <DepartmentPicker id="profile-department-picker" value={departmentText} onChange={setDepartmentText} />
        <DepartmentField
          id="profile-department"
          value={departmentText}
          onChange={setDepartmentText}
          hint="Centred under the logo. Faculties drop “Faculty of”, as most of UNBC’s own avatars do; a faculty whose avatar reads otherwise prints that. Long names wrap and shrink to fit; press Enter to force a line break."
        />

        <div className="field">
          <span className="field__label">Shape</span>
          <div className="chips">
            {SHAPES.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip${shape === option.value ? ' chip--on' : ''}`}
                onClick={() => setShape(option.value)}
              >
                {option.label}
              </button>
            ))}
            {shape === 'square' && (
              <button
                type="button"
                className={`chip${cropPreview ? ' chip--on' : ''}`}
                aria-pressed={cropPreview}
                onClick={() => setCropPreview(!cropPreview)}
              >
                Preview circle crop
              </button>
            )}
          </div>
          <p className="hint">
            {shape === 'square'
              ? 'The square from the Graphics Standards Manual. Platforms that crop to a circle cut its corners — preview that, or use the circle.'
              : 'The circle from the Graphics Standards Manual: smaller letters, a larger caption, everything inside the circle. Transparent outside it.'}
          </p>
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
