import { Box, Container, Stack, Typography } from '@mui/material'

/** Keep editorial line breaks on wide layouts and natural wrapping on phones. */
export function CaptionText({ text, breakAfter }) {
  const index = breakAfter ? text.indexOf(breakAfter) : -1
  if (index < 0) return text
  const split = index + breakAfter.length
  return (
    <>
      <Box component="span" data-caption-first sx={{ display: { xs: 'inline', md: 'block' } }}>{text.slice(0, split)}</Box>{' '}
      <Box component="span" data-caption-second>{text.slice(split).trimStart()}</Box>
    </>
  )
}

// The navigation is 65px / 73px tall including its one-pixel border.
// Anchor every intro divider at mid-screen, with room for wrapped text
// on short screens. Paragraph length and action buttons cannot move it.
export const heroSx = {
  minHeight: { xs: 'max(336px, calc(50svh - 65px))', sm: 'max(272px, calc(50svh - 65px))', md: 'max(288px, calc(50svh - 73px))' },
  pt: { xs: 5, sm: 6, md: 8 }, pb: { xs: 3, sm: 4 },
}

/** Page opener with a single title and its supporting description. */
export function PageHero({ title, description, descriptionBreakAfter, children, rule = true }) {
  return (
    <>
      <Box
        component="header"
        sx={{ position: 'relative', overflow: 'hidden', flexShrink: 0, ...heroSx }}
      >
        <Container>
          <Box data-page-intro sx={{ position: 'relative' }}>
            <Typography
              component="h1"
              variant="h1"
              sx={{ maxWidth: 980, fontSize: { xs: '2.6rem', sm: '3.2rem', md: 'clamp(3.5rem, 4.6vw, 4.25rem)' } }}
            >
              {title}
            </Typography>
            {description && (
              <Typography
                component="p"
                color="text.secondary"
                sx={{
                  mt: { xs: 2.5, md: 3 },
                  maxWidth: 960,
                  textWrap: descriptionBreakAfter ? 'wrap' : 'balance',
                  fontSize: { xs: '1.08rem', md: '1.2rem' },
                  lineHeight: 1.6,
                }}
              >
                <CaptionText text={description} breakAfter={descriptionBreakAfter} />
              </Typography>
            )}
          </Box>
        </Container>
        {rule && (
          <Container aria-hidden="true" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
            <Box data-page-divider sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />
          </Container>
        )}
      </Box>
      {children && (
        <Container sx={{ pt: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
            {children}
          </Stack>
        </Container>
      )}
    </>
  )
}

/**
 * Open page section, with an optional tonal change for narrative pacing.
 */
export function Section({ children, tone = 'default', id, sx }) {
  return (
    <Box
      component="section"
      id={id}
      sx={{
        py: { xs: 7, md: 12 },
        bgcolor: tone === 'raised' ? 'surface.raised' : 'transparent',
        ...sx,
      }}
    >
      <Container>{children}</Container>
    </Box>
  )
}

/** Heading row: title on the left, optional action anchored to the right. */
export function SectionHead({ title, description, action, size = 'md' }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={{ xs: 2, md: 4 }} sx={{ alignItems: { md: 'flex-end' }, justifyContent: 'space-between', mb: { xs: 4, md: 7 } }}
    >
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: action ? 820 : 'none' }}>
        <Typography
          component="h2"
          variant="h2"
          sx={{ fontSize: size === 'sm' ? { xs: '1.6rem', md: '2rem' } : { xs: '2.5rem', md: '3.7rem' } }}
        >
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 860, textWrap: 'balance' }}>
            {description}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Stack>
  )
}

/** Responsive tile grid. Every list on the site is laid out through this. */
export function TileGrid({ children, min = 300, columns, gap = 2.5, showLastDivider = false }) {
  return (
    <Box
      sx={{
        display: 'grid',
        // Exposed so tiles can light the divider of the row below them.
        '--tile-gap': typeof gap === 'object'
          ? Object.fromEntries(Object.entries(gap).map(([bp, value]) => [bp, `calc(var(--mui-spacing) * ${value})`]))
          : `calc(var(--mui-spacing) * ${gap})`,
        gap: 'var(--tile-gap)',
        ...(showLastDivider ? {} : { '& > :last-child': { '--tile-divider-below': 'hidden' } }),
        gridTemplateColumns: columns || {
          xs: '1fr',
          sm: `repeat(auto-fill, minmax(${min}px, 1fr))`,
        },
        alignItems: 'stretch',
      }}
    >
      {children}
    </Box>
  )
}
