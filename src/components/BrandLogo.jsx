'use client'

import { Box } from '@mui/material'
import { site } from '@/lib/site'

/**
 * The original BayesOps long-format SVG. It is loaded as an ordinary image so
 * every browser resolves its radial gradient. In light mode the base image is
 * darkened for legible lettering, then the untouched gradient mark is layered
 * back over it at the same coordinates used by the original wordmark.
 */
export default function BrandLogo({ sx, ...props }) {
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        display: 'block',
        position: 'relative',
        aspectRatio: '290.22 / 62.85',
        ...sx,
      }}
      {...props}
    >
      <Box
        component="img"
        src={site.logo}
        alt=""
        sx={(theme) => ({
          display: 'block',
          width: '100%',
          height: '100%',
          filter: 'brightness(0)',
          ...theme.applyStyles('dark', { filter: 'none' }),
        })}
      />
      <Box
        component="img"
        src={site.icon}
        alt=""
        sx={(theme) => ({
          display: 'block',
          position: 'absolute',
          top: 0,
          left: '55.84%',
          width: '21.66%',
          height: '100%',
          ...theme.applyStyles('dark', { display: 'none' }),
        })}
      />
    </Box>
  )
}
