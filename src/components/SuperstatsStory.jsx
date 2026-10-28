import { Box, Container, Typography } from '@mui/material'
import SuperstatsPosterior from './SuperstatsPosterior'
import { ArrowLinkButton } from './links'
import { getSuperstatsDemo } from '@/lib/content'

const headingSx = { fontSize: { xs: '2.15rem', md: 'clamp(2.4rem, 3.2vw, 4rem)' }, textWrap: 'balance' }

export default function SuperstatsStory({ sections }) {
  return (
    <>
      <Box component="section" aria-labelledby="superstats-posterior" sx={{ bgcolor: 'surface.raised', py: { xs: 6, md: 9 } }}>
        <Container>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 3, alignItems: 'end', mb: 5 }}>
            <Box>
              <Typography component="h2" id="superstats-posterior" variant="h2" sx={headingSx}>{sections.posterior.title}</Typography>
            </Box>
            <Typography color="text.secondary" sx={{ maxWidth: 580 }}>{sections.posterior.body}</Typography>
          </Box>
          <SuperstatsPosterior demo={getSuperstatsDemo()} caption={sections.posterior.caption} />
        </Container>
      </Box>
      <Container component="section" aria-labelledby="superstats-workflow" sx={{ py: { xs: 7, md: 11 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(0, 1.2fr)' }, gap: { xs: 4, md: 8 } }}>
          <Box>
            <Typography component="h2" id="superstats-workflow" variant="h2" sx={headingSx}>{sections.workflow.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 3, maxWidth: 510 }}>{sections.workflow.body}</Typography>
            <ArrowLinkButton href={sections.workflow.href} accent="primary" sx={{ mt: 3, px: 0 }}>{sections.workflow.linkLabel}</ArrowLinkButton>
          </Box>
          <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {sections.workflow.steps.map((step, index) => (
              <Box component="li" key={step.title} sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3, display: 'grid', gridTemplateColumns: '2ch minmax(0, 1fr)', gap: 3 }}>
                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'primary.main', pt: .5 }}>{String(index + 1).padStart(2, '0')}</Typography>
                <Box><Typography component="h3" sx={{ fontSize: '1.2rem', fontWeight: 500 }}>{step.title}</Typography><Typography color="text.secondary" sx={{ mt: 1, fontSize: '.95rem' }}>{step.body}</Typography></Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </>
  )
}
