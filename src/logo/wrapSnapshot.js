import { layoutProfileCaption } from '../profile/renderProfileSvg.js'
import { splitDepartmentText } from './logoText.js'

// How each name wraps on the lockup and in a profile-picture caption — the two places the
// wrapping rules decide where a department line breaks.
export const computeWrapSnapshot = (names) => Object.fromEntries(
  [...names].sort((a, b) => a.localeCompare(b)).map((name) => {
    const caption = layoutProfileCaption(name)
    return [name, {
      lockup: splitDepartmentText(name),
      profile: { lines: caption.lines, fontSize: caption.fontSize }
    }]
  })
)
