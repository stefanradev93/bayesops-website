'use client'

import NextLink from 'next/link'
import { Box, Button, Link as MuiLink } from '@mui/material'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import { linkHoverSx } from '@/theme/effects'

// `next/link` is not a client-component reference, so it cannot be handed to a
// MUI component as `component={...}` from a server component. These thin client
// wrappers do the composition on the client side instead.

const isInternal = (href = '') => href.startsWith('/') || href.startsWith('#')

export function LinkButton({ href, children, ...props }) {
  if (isInternal(href)) {
    return (
      <Button component={NextLink} href={href} {...props}>
        {children}
      </Button>
    )
  }
  return (
    <Button component="a" href={href} target="_blank" rel="noreferrer" {...props}>
      {children}
    </Button>
  )
}

/** Text action with an outlined arrow circle that fills on hover or focus. */
export function ArrowLinkButton({ accent = 'secondary', idleColor = '#000000', arrowColor = 'background.default', sx = [], children, ...props }) {
  return (
    <LinkButton
      {...props}
      color="inherit"
      endIcon={
        <Box
          component="span"
          className="arrow-link-circle"
          aria-hidden="true"
          sx={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: '50%', border: '1.5px solid currentColor', bgcolor: 'transparent', transition: 'transform .18s ease, background-color .18s ease' }}
        >
          <ArrowForwardRounded sx={{ fontSize: 18, color: 'inherit' }} />
        </Box>
      }
      sx={[
        {
          color: idleColor, bgcolor: 'transparent', boxShadow: 'none',
          '&:hover, &:focus-visible': { color: `${accent}.main`, bgcolor: 'transparent', boxShadow: 'none' },
          '.dark &': { color: 'text.primary', '&:hover, &:focus-visible': { color: `${accent}.main` } },
          '&:hover .arrow-link-circle, &:focus-visible .arrow-link-circle': { transform: 'translateX(4px)', bgcolor: 'currentColor' },
          '&:hover .arrow-link-circle svg, &:focus-visible .arrow-link-circle svg': { color: arrowColor },
          '&:focus-visible': { textDecoration: 'underline', textUnderlineOffset: '4px' },
          '@media (prefers-reduced-motion: reduce)': {
            '&:hover .arrow-link-circle, &:focus-visible .arrow-link-circle': { transform: 'none' },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </LinkButton>
  )
}

/** Unstyled block-level link, for footer columns and breadcrumbs. */
export function TextLink({ href, children, sx, ...props }) {
  const internal = isInternal(href)
  const external = !internal && !href.startsWith('mailto:')
  return (
    <Box
      component={internal ? NextLink : 'a'}
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      sx={{ textDecoration: 'none', color: 'inherit', ...linkHoverSx, ...sx }}
      {...props}
    >
      {children}
    </Box>
  )
}

// Prose links carry an underline so they do not rely on colour alone.
const markdownLinkSx = {
  color: 'text.primary',
  textDecoration: 'underline',
  textDecorationColor: 'var(--mui-palette-divider)',
  textUnderlineOffset: '0.18em',
  transition: 'color .18s ease, text-decoration-color .18s ease',
  '&:hover, &:focus-visible': { color: 'primary.main', textDecorationColor: 'currentColor' },
}

/** Anchor renderer for Markdown bodies. */
export function MarkdownLink({ href = '', children }) {
  if (isInternal(href)) {
    return (
      <MuiLink component={NextLink} href={href} underline="none" sx={markdownLinkSx}>
        {children}
      </MuiLink>
    )
  }
  return (
    <MuiLink href={href} target="_blank" rel="noreferrer" underline="none" sx={markdownLinkSx}>
      {children}
    </MuiLink>
  )
}
