import {
  PROFILE_CIRCLE_LAYOUT,
  PROFILE_LAYOUT,
  layoutProfileCaption,
  profileCaptionText
} from '../profile/renderProfileSvg.js'
import { splitDepartmentText } from './logoText.js'

// How each name wraps everywhere the wrapping rules decide where a department line breaks: the
// lockup, and the caption of each profile-picture layout (which prints the name as an avatar
// would, "Faculty of" dropped).
const caption = (name, layout) => {
  const { lines, fontSize } = layoutProfileCaption(profileCaptionText(name), layout)
  return { lines, fontSize }
}

export const computeWrapSnapshot = (names) => Object.fromEntries(
  [...names].sort((a, b) => a.localeCompare(b)).map((name) => [name, {
    lockup: splitDepartmentText(name),
    profile: caption(name, PROFILE_LAYOUT),
    profileCircle: caption(name, PROFILE_CIRCLE_LAYOUT)
  }])
)
