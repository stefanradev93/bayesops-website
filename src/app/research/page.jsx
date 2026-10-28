import { Box, Typography } from '@mui/material'
import { PageHero, Section, SectionHead, TileGrid } from '@/components/PageElements'
import ResearchFigure from '@/components/ResearchFigure'
import PublicationBrowser from '@/components/PublicationBrowser'
import { ProjectTile } from '@/components/Tiles'
import { getAwards, getCitations } from '@/lib/content'

export const metadata = {
  title: 'Research',
  description:
    'The BayesOps research directions, funded awards, and recent papers spanning Bayesian inference, generative AI, and computational modeling.',
  alternates: { canonical: '/research' },
}

const streams = [
  {
    title: 'AI-accelerated Bayesian methods',
    lead: 'AI-accelerated',
    emphasis: 'Bayesian methods',
    text: 'We develop fast and scalable Bayesian methods for parameter estimation, model comparison, and data acquisition.',
    figureLabel: 'AI-accelerated Bayesian methods',
  },
  {
    title: 'Modeling complex systems',
    lead: 'Modeling',
    emphasis: 'complex systems',
    text: 'We craft models that turn (big) data into mechanistic insight across cognition, neuroscience, biology, and engineering.',
    figureLabel: 'Modeling complex systems',
  },
]

export default function ResearchPage() {
  const awards = getAwards()
  const citations = getCitations()

  return (
    <>
      <PageHero
        title="Research"
        description="Everything we do is Bayesian. We teach neural networks how to do statistics. This lets us build better models of our world."
        descriptionBreakAfter="statistics."
        rule={false}
      />

      <Section id="directions" sx={{ pt: { xs: 0, md: 0 }, pb: { xs: 4, md: 7 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 4, md: 8 } }}>
          {streams.map((stream, index) => (
            <Box
              component="article"
              key={stream.title}
              sx={{
                position: 'relative',
                '--research-accent': index === 0 ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-secondary-main)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minWidth: 0,
                borderTop: '1px solid',
                borderColor: 'divider',
                '&::before': {
                  content: '""', position: 'absolute', top: -1, left: 0, right: 0, height: '1px',
                  bgcolor: 'var(--research-accent)',
                  boxShadow: '0 0 12px color-mix(in srgb, var(--research-accent) 55%, transparent)',
                  opacity: 0, transition: 'opacity .18s ease', pointerEvents: 'none',
                },
                '&:hover::before, &:focus-within::before': { opacity: 1 },
                pt: { xs: 4, md: 5 },
                pb: { xs: 4, md: 6 },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography component="h2" variant="h2" sx={{ fontSize: { xs: 'clamp(1.85rem, 8.1vw, 2.3rem)', md: 'clamp(2.1rem, 2.6vw, 3.15rem)' }, maxWidth: 500 }}>
                  {stream.lead}{' '}
                  <Box component="span" sx={{ display: 'block', whiteSpace: 'nowrap', fontWeight: 450, color: index === 0 ? 'primary.main' : 'secondary.main' }}>{stream.emphasis}</Box>
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 3, maxWidth: '100%', textWrap: 'balance', fontSize: '1.06rem' }}>{stream.text}</Typography>
              </Box>
              <Box
                component="figure"
                aria-label={index === 0 ? 'Eight violet Bayesian diagnostic plots: four parameter-recovery plots with posterior uncertainty above their corresponding calibration ECDF differences, updating as samples accumulate' : 'Virus propagation through a moving 128-node network based on a Delaunay mesh with long edges removed, starting in grayscale with infection chains tracing its connections in rose'}
                sx={{ m: 0, minWidth: 0 }}
              >
                <ResearchFigure kind={index === 0 ? 'bayesian' : 'systems'} sx={{ height: index === 0 ? { xs: 230, sm: 300, md: 'clamp(260px, 22vw, 400px)' } : { xs: 280, sm: 350, md: 'clamp(300px, 26vw, 460px)' } }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Section>

      <Section id="awards" tone="raised">
        <SectionHead
          title="Our awards"
          size="sm"
          description="We gratefully acknowledge the generous support of the NSF and NIH in funding our research."
        />
        <TileGrid columns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }} gap={{ xs: 5, md: 8 }} showLastDivider>
          {awards.map((award) => <ProjectTile key={award.slug} item={award} textFirst />)}
        </TileGrid>
      </Section>

      <Section id="publications">
        <PublicationBrowser citations={citations} />
      </Section>
    </>
  )
}
