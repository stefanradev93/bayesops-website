import { Fragment } from 'react'
import { Box, Container, Typography } from '@mui/material'
import BayesFlowBackendOrbit from './BayesFlowBackendOrbit'
import BayesFlowDiagnostics from './BayesFlowDiagnostics'
import { getBayesFlowDemo } from '@/lib/content'
import { BayesFlowDemoProvider } from './BayesFlowDemoContext'
import BayesFlowSimulation from './BayesFlowSimulation'
import BayesFlowDensityBackground from './BayesFlowDensityBackground'

const headingSx = { fontSize: { xs: '2.15rem', md: 'clamp(2.4rem, 3.2vw, 4rem)' }, textWrap: 'balance' }

// Copy can place a logo in running text with a {name} token.
const inlineLogos = {
  keras: <Box component="img" src="/images/products/bayesflow/keras.svg" alt="Keras" sx={{ display: 'inline-block', height: '1.35em', width: 'auto', mx: '.2em', verticalAlign: '-.35em', borderRadius: '2px' }} />,
}

const withInlineLogos = (text) => text.split(/\{(\w+)\}/).map((part, index) =>
  index % 2 ? <Fragment key={index}>{inlineLogos[part] ?? `{${part}}`}</Fragment> : part)

function StoryCopy({ section }) {
  return (
    <Box sx={{ position: 'relative', minWidth: 0 }}>
      <Typography component="h2" variant="h2" sx={headingSx}>{section.title}{section.emphasis && <Box component="span" sx={{ display: 'block', color: 'primary.main' }}>{section.emphasis}</Box>}</Typography>
      <Typography color="text.secondary" sx={{ mt: 3, maxWidth: 460 }}>{withInlineLogos(section.body)}</Typography>
    </Box>
  )
}

export default function BayesFlowStory({ sections }) {
  const demo = getBayesFlowDemo()
  return (
    <BayesFlowDemoProvider demo={demo}>
      <Container sx={{ pt: { xs: 7, md: 12 }, pb: { xs: 6, md: 9 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, columnGap: { md: 6, lg: 8 }, rowGap: { xs: 7, md: 5 } }}>
          <Box component="section" aria-label="BayesFlow learns inference from your simulator" sx={{ minWidth: 0, display: 'grid', gridTemplateRows: { xs: 'auto auto', md: 'subgrid' }, gridRow: { md: 'span 2' }, rowGap: 5 }}>
            <StoryCopy section={sections.simulation} />
            <BayesFlowSimulation />
          </Box>
          <Box component="section" aria-label="BayesFlow backend support" sx={{ minWidth: 0, position: 'relative', isolation: 'isolate', overflow: 'clip', display: 'grid', gridTemplateRows: { xs: 'auto auto', md: 'subgrid' }, gridRow: { md: 'span 2' }, rowGap: 5 }}>
            <BayesFlowDensityBackground />
            <StoryCopy section={sections.backends} />
            <Box component="figure" sx={{ m: 0, minWidth: 0, position: 'relative', alignSelf: 'start' }}>
              <BayesFlowBackendOrbit />
            </Box>
          </Box>
        </Box>
      </Container>
      <Container component="section" id="bayesflow-diagnostics" aria-label="BayesFlow posterior estimation and diagnostics demo" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 7, md: 12 } }}>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: { xs: 6, md: 9 }, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, .65fr) minmax(0, 1.65fr)' }, gap: { xs: 5, lg: 7 }, alignItems: 'start' }}>
          <StoryCopy section={sections.diagnostics} />
          <Box component="figure" sx={{ m: 0, minWidth: 0 }}>
            <BayesFlowDiagnostics />
            <Typography component="figcaption" color="text.secondary" sx={{ mt: 3, maxWidth: 760, fontSize: '.75rem', lineHeight: 1.7 }}>{sections.diagnostics.caption}</Typography>
          </Box>
        </Box>
      </Container>
    </BayesFlowDemoProvider>
  )
}
