import { Box, Container, Typography } from '@mui/material'
import CogFormerRecovery from './CogFormerRecovery'
import CollapsibleProductEmbed from './CollapsibleProductEmbed'
import { assetUrl } from '@/lib/format'

function StoryCopy({ section }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="h2" variant="h2" sx={{ fontSize: { xs: '2.15rem', md: 'clamp(2.4rem, 3.2vw, 4rem)' }, textWrap: 'balance' }}>
        {section.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 3, maxWidth: 510 }}>
        {section.body}
      </Typography>
    </Box>
  )
}

export default function CogFormerStory({ sections, demoUrl }) {
  return (
    <>
      <Container component="section" aria-label="CogFormer model families" sx={{ minHeight: '100svh', py: { xs: 7, md: 10 }, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1.6fr)' }, gap: { xs: 5, lg: 6 }, alignItems: 'center' }}>
          <StoryCopy section={sections.bayesgpt} />
          <Box component="figure" sx={{ m: 0, minWidth: 0 }}>
            <Box component="img" src={assetUrl('images/projects/bayesgpt.svg')} alt="Model hierarchy: experimental covariates define a model species, parameters define a model family such as the DDM, and related families such as DDM, RDM, and CDM form a sequential-sampling model class." width="721" height="219.673" loading="lazy" sx={{ display: 'block', width: '100%', height: 'auto', '.dark &': { display: 'none' } }} />
            <Box component="img" src={assetUrl('images/projects/bayesgpt-dark.svg')} alt="Model hierarchy: model species, model families, and the sequential-sampling model class." width="721" height="219.673" loading="lazy" sx={{ display: 'none', width: '100%', height: 'auto', '.dark &': { display: 'block' } }} />
          </Box>
        </Box>
      </Container>
      <Container component="section" aria-label="CogFormer ensemble recovery illustration" sx={{ minHeight: '100svh', py: { xs: 7, md: 10 }, display: 'flex', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2.2fr) minmax(0, 1fr)' }, gap: { xs: 5, lg: 6 }, alignItems: 'center' }}>
          <Box component="figure" sx={{ m: 0, minWidth: 0 }}>
            <CogFormerRecovery />
          </Box>
          <Box>
            <StoryCopy section={sections.recovery} />
            <Typography color="text.secondary" sx={{ mt: 3, maxWidth: 510 }}>{sections.recovery.description}</Typography>
          </Box>
        </Box>
      </Container>
      <Box component="section" id="cogformer-demo" aria-label="Live CogFormer inference demo" sx={{ pb: { xs: 7, md: 12 } }}>
        <Container>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: { xs: 6, md: 9 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 4, alignItems: 'end', mb: 5 }}>
              <StoryCopy section={sections.demo} />
              <Typography color="text.secondary" sx={{ fontSize: '.85rem', maxWidth: 510 }}>{sections.demo.caption}</Typography>
            </Box>
          </Box>
        </Container>
        <CollapsibleProductEmbed href={demoUrl} title="CogFormer live demo: configure cognitive models and inspect Bayesian inference" />
      </Box>
    </>
  )
}
