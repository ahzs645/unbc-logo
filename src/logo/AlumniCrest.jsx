import React, { useMemo } from 'react'
import { renderCrestMarkup } from './renderLogoSvg'

/**
 * The UNBC Alumni crest as an SVG <g>. `transform` positions and scales it in the parent SVG
 * (native 59.27×67.82 viewBox).
 *
 * `variant` is 'full' for the original gold/green/black artwork, or a colour name/hex to flatten
 * it into a single-colour mark. Fills stay presentation attributes so the crest survives svg2pdf.
 */
export const AlumniCrest = ({ transform, occupant = 'primary', variant = 'full', knockoutColor }) => {
  const markup = useMemo(
    () => renderCrestMarkup({ variant, knockoutColor }),
    [variant, knockoutColor]
  )

  return (
    <g
      transform={transform}
      data-alumni-occupant={occupant}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
