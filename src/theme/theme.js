'use client'

import { createTheme } from '@mui/material/styles'
import { neonBoxShadow, neonIconFilter, linkHoverSx } from './effects'

// Warm paper and deep ink, with vivid violet and raspberry accents.
const light = {
  canvas: '#F6F4EF',
  paper: '#FAF9F6',
  raised: '#ECEAE5',
  ink: '#24242C',
  muted: '#66656F',
  line: 'rgba(36, 36, 44, 0.16)',
  accent: '#603EF0',
  signal: '#C81C78',
}

const dark = {
  canvas: '#17171F',
  paper: '#1D1D27',
  raised: '#24242F',
  ink: '#F1EFEA',
  muted: '#B1AEBE',
  line: 'rgba(241, 239, 234, 0.16)',
  accent: '#AF91FF',
  signal: '#FF80BF',
}

const scheme = (c) => ({
  palette: {
    primary: { main: c.accent, contrastText: c === light ? '#FFFFFF' : '#17171F' },
    secondary: { main: c.signal, contrastText: c === light ? '#FFFFFF' : '#101010' },
    background: { default: c.canvas, paper: c.paper },
    text: { primary: c.ink, secondary: c.muted },
    divider: c.line,
    // Extra surface tokens used by tiles and section bands.
    surface: { canvas: c.canvas, raised: c.raised, line: c.line },
  },
})

const display = 'var(--font-display), ui-sans-serif, system-ui, sans-serif'
const sans = 'var(--font-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
const mono = 'var(--font-mono), ui-monospace, "SFMono-Regular", Consolas, monospace'

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: { light: scheme(light), dark: scheme(dark) },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: sans,
    h1: { fontFamily: display, fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 1.06 },
    h2: { fontFamily: display, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1.12 },
    h3: { fontFamily: display, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.18 },
    h4: { fontFamily: display, fontWeight: 450, letterSpacing: '-0.015em', lineHeight: 1.24 },
    h5: { fontWeight: 600, letterSpacing: '-0.011em', lineHeight: 1.3 },
    h6: { fontWeight: 600, letterSpacing: '-0.008em', lineHeight: 1.4 },
    subtitle1: { lineHeight: 1.6 },
    body1: { lineHeight: 1.68, letterSpacing: '-0.003em' },
    body2: { lineHeight: 1.6, letterSpacing: '-0.002em' },
    button: { fontFamily: sans, fontWeight: 500, textTransform: 'none', letterSpacing: '-0.015em' },
    overline: {
      fontFamily: mono,
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      lineHeight: 1.8,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
          WebkitFontSmoothing: 'antialiased',
          // Fluid root size: every rem scales from the reader's default (100%) at
          // 1440px wide up to 112.5% at 2560px, so text keeps pace on large screens.
          // The 100% floor keeps body text at the browser default on phones and
          // laptops; headlines already scale down with their own vw clamps.
          fontSize: 'clamp(100%, 0.839rem + 0.179vw, 112.5%)',
        },
        body: { minWidth: 320 },
        '::selection': { backgroundColor: 'color-mix(in srgb, var(--mui-palette-primary-main) 23%, transparent)' },
        '@media (prefers-reduced-motion: reduce)': {
          html: { scrollBehavior: 'auto' },
          '*, *::before, *::after': { animation: 'none !important', transition: 'none !important' },
        },
        // Anchor targets clear the sticky header.
        '[id]': { scrollMarginTop: '96px' },
      },
    },
    MuiContainer: {
      defaultProps: { maxWidth: false },
      styleOverrides: {
        root: {
          paddingLeft: 'clamp(20px, 5vw, 144px)',
          paddingRight: 'clamp(20px, 5vw, 144px)',
          '@media (min-width: 600px)': {
            paddingLeft: 'clamp(20px, 5vw, 144px)',
            paddingRight: 'clamp(20px, 5vw, 144px)',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 2,
          paddingInline: 20,
          paddingBlock: 10,
          transition: 'background-color .18s ease, color .18s ease, box-shadow .2s ease',
          '&:hover, &:focus-visible': { boxShadow: neonBoxShadow },
        },
        sizeLarge: { paddingInline: 26, paddingBlock: 12, fontSize: '1rem' },
        outlined: { borderColor: 'var(--mui-palette-divider)' },
        text: { paddingInline: 8 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'color .18s ease, filter .18s ease, background-color .18s ease',
          '&:hover, &:focus-visible': { color: 'var(--mui-palette-primary-main)', filter: neonIconFilter, backgroundColor: 'color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)' },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: {
      defaultProps: { variant: 'outlined', elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none', borderColor: 'var(--mui-palette-divider)' } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, letterSpacing: '-0.002em', borderRadius: '999px' },
        outlined: { borderColor: 'var(--mui-palette-divider)' },
        clickable: { transition: 'box-shadow .18s ease', '&:hover, &:focus-visible': { boxShadow: neonBoxShadow } },
      },
    },
    MuiLink: { defaultProps: { underline: 'hover' }, styleOverrides: { root: linkHoverSx } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          transition: 'box-shadow .18s ease',
          '&:hover, &.Mui-focused': { boxShadow: neonBoxShadow },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: false },
      styleOverrides: { tooltip: { fontSize: '0.75rem', paddingInline: 10, paddingBlock: 6 } },
    },
  },
})

export default theme
