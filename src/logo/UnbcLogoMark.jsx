import React, { useMemo } from 'react'
import { DEPARTMENT_LINE } from './logoText'
import { recolorMark } from './logoColors'
import { LOGO_FONT_FAMILY, resolveLockup } from './renderLogoSvg'
import { UNBC_LOGO } from '../assets/markup'

/**
 * The UNBC wordmark lockup as an SVG <g>, optionally with a bold department line under the
 * "University of Northern British Columbia" subtitle.
 *
 * `transform` positions and scales it inside a parent SVG; all coordinates are the logo's native
 * 178×80 viewBox, so the department line stays aligned with the subtitle at any scale.
 *
 * Department lines are emitted as real <text> nodes rather than baked into the recoloured markup,
 * so downstream PDF exporters can still find and restyle them.
 *
 * Colour defaults to white — the artwork's native knockout form — so callers that pass only
 * `transform`/`departmentText`/`fontFamily` render exactly as they did before colour support.
 */
export const UnbcLogoMark = ({
  transform,
  departmentText = '',
  fontFamily = LOGO_FONT_FAMILY,
  color = 'white',
  departmentColor,
  maxWidth
}) => {
  const { lines, markColor, departmentFill } = resolveLockup({
    departmentText,
    color,
    departmentColor,
    maxWidth
  })

  const markup = useMemo(() => recolorMark(UNBC_LOGO.inner, markColor), [markColor])

  return (
    <g transform={transform}>
      <g dangerouslySetInnerHTML={{ __html: markup }} />
      {lines.map((line, index) => (
        <text
          key={index}
          x={DEPARTMENT_LINE.x}
          y={DEPARTMENT_LINE.y + index * DEPARTMENT_LINE.lineHeight}
          fontFamily={fontFamily}
          fontSize={DEPARTMENT_LINE.fontSize}
          fontWeight={DEPARTMENT_LINE.fontWeight}
          fill={departmentFill}
        >
          {line}
        </text>
      ))}
    </g>
  )
}
