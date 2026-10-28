'use client'

import { Box } from '@mui/material'
import { assetUrl } from '@/lib/format'

/** Shared product marks keep the catalog and detail headers in sync. */
export default function ProductLogo({ src, darkSrc, whiteInDark = false, sx }) {
  const imageStyles = {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  }

  return (
    <Box component="span" aria-hidden="true" sx={{ display: 'block', position: 'relative', flexShrink: 0, ...sx }}>
      <Box
        component="img"
        src={assetUrl(src)}
        alt=""
        sx={(theme) => ({
          ...imageStyles,
          ...theme.applyStyles('dark', {
            ...(darkSrc && { visibility: 'hidden' }),
            ...(whiteInDark && { filter: 'brightness(0) invert(1)' }),
          }),
        })}
      />
      {darkSrc && (
        <Box
          component="img"
          src={assetUrl(darkSrc)}
          alt=""
          sx={(theme) => ({
            ...imageStyles,
            position: 'absolute',
            inset: 0,
            visibility: 'hidden',
            ...theme.applyStyles('dark', { visibility: 'visible' }),
          })}
        />
      )}
    </Box>
  )
}
