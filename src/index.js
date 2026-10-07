// UNBC logo generator — public API.
//
// Two layers, deliberately separated:
//
//   * The core (logo/, departments/, export/) is plain JavaScript with no React dependency.
//     renderLogoSvg() and the wrapping rules run in Node, a worker, or any framework.
//   * The React components are a convenience for apps already using React (the door-sign
//     generator drives its artwork through them). Importing them pulls in React; importing only
//     the core does not.

// ── Core rendering (framework-free) ──────────────────────────────────────────────────────────
export {
  renderLogoSvg,
  renderLogoMarkup,
  renderCrestSvg,
  renderCrestMarkup,
  resolveLockup,
  measureLockupHeight,
  escapeXml,
  LOGO_FONT_FAMILY,
  CREST_VIEWBOX
} from './logo/renderLogoSvg.js'

// ── Social-media profile picture (framework-free) ──────────────────────────────────────────
export {
  renderProfileSvg,
  layoutProfileCaption,
  findCircleCropOverflow,
  PROFILE_COLORS,
  PROFILE_LAYOUT
} from './profile/renderProfileSvg.js'

// ── Text layout: the wrapping rules the lockup must obey ─────────────────────────────────────
export {
  splitDepartmentText,
  measureDepartmentText,
  DEPARTMENT_LINE,
  LOGO_VIEWBOX
} from './logo/logoText.js'

// ── Colour variants ──────────────────────────────────────────────────────────────────────────
export {
  BRAND_COLORS,
  LOGO_VARIANTS,
  resolveColor,
  isLightColor,
  recolorMark,
  recolorCrest
} from './logo/logoColors.js'

// ── Export (browser) ─────────────────────────────────────────────────────────────────────────
export {
  exportLogo,
  renderLogoBlob,
  buildSvgSource,
  buildFileName,
  downloadBlob,
  isFormatSupported,
  EXPORT_FORMATS,
  EXPORT_FORMAT_ORDER,
  SIZE_PRESETS,
  PROFILE_SIZE_PRESETS
} from './export/exportLogo.js'
export { getEmbeddedFontCss, BRAND_FONT_FAMILY } from './export/fontEmbed.js'

// ── Departments ──────────────────────────────────────────────────────────────────────────────
export { departmentTypes, departmentAlternateNames } from './departments/departmentData.js'
export {
  departmentPresets,
  departmentPresetGroups,
  searchDepartmentPresets
} from './departments/presets.js'
export {
  searchDepartmentHierarchy,
  getDepartmentDisplayName,
  hasDepartmentSelection,
  toDepartmentSelection,
  EMPTY_DEPARTMENT_SELECTION
} from './departments/hierarchy.js'

// ── React components ─────────────────────────────────────────────────────────────────────────
export { UnbcLogoMark } from './logo/UnbcLogoMark.jsx'
export { AlumniCrest } from './logo/AlumniCrest.jsx'
export { DepartmentSelector } from './departments/DepartmentSelector.jsx'
export { DepartmentSelectionDisplay } from './departments/DepartmentSelectionDisplay.jsx'
