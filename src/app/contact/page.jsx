import { Box, Button, Stack, Typography } from '@mui/material'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import PlaceOutlined from '@mui/icons-material/PlaceOutlined'
import { PageHero, Section, SectionHead, TileGrid } from '@/components/PageElements'

const institution = 'Rensselaer Polytechnic Institute'
const contactEmail = 'radevs@rpi.edu'

export const metadata = {
  title: 'Contact',
  description:
    'Get in touch with the BayesOps lab at Rensselaer Polytechnic Institute about research opportunities, independent study projects, and collaborations.',
  alternates: { canonical: '/contact' },
}

// The topics we invite enquiries about, from the original contact page.
const interests = [
  {
    title: 'Bayesian modeling',
    text: 'New Bayesian methodology, from theory through to practical workflows.',
  },
  {
    title: 'Generative AI for science',
    text: 'Application and development of generative AI as an engine for scientific inference.',
  },
  {
    title: 'Open-source software',
    text: 'Research software for statistical inference that the wider community can build on.',
  },
  {
    title: 'Cognitive modeling',
    text: 'Cognitive modeling, behavioral data science, and inference at the scale of big data.',
  },
]

const mapSrc =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2930.769804023383!2d-73.68146868806319!3d42.72976277104071!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89de0f9eebfa097d%3A0xa5592b13db1f5302!2sRensselaer%20Polytechnic%20Institute!5e0!3m2!1sen!2sus!4v1760324569919!5m2!1sen!2sus'

export default function ContactPage() {
  return (
    <>
      <Box
        sx={{
          minHeight: { xs: 'calc(100svh - 64px)', md: 'calc(100svh - 72px)' },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PageHero
          title="Contact"
          description="We are always excited to hear from students and researchers. Drop us a message if you want to discuss research opportunities, independent study projects, or collaborations."
        >
          <Button
            component="a"
            href={`mailto:${contactEmail}`}
            size="large"
            startIcon={<EmailOutlined />}
            sx={{
              bgcolor: 'text.primary',
              color: 'background.default',
              '&:hover': { bgcolor: 'text.primary', opacity: 0.86 },
            }}
          >
            Get in touch
          </Button>
        </PageHero>

        <Section sx={{ pt: { xs: 4, md: 6 }, flex: 1 }}>
          <SectionHead
            title="What we would love to hear about"
            size="sm"
            description="If your interests overlap with any of these, we want to talk."
          />
          <TileGrid columns={{ xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }}>
            {interests.map((interest, index) => (
              <Box
                key={interest.title}
                sx={{
                  pt: 3,
                  pb: 2,
                  height: '100%',
                  borderTop: '1px solid',
                  borderTopColor: index % 2 ? 'primary.main' : 'secondary.main',
                }}
              >
                <Typography component="h3" sx={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>
                  {interest.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                  {interest.text}
                </Typography>
              </Box>
            ))}
          </TileGrid>
        </Section>
      </Box>

      <Section tone="raised">
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 7 },
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 5fr) minmax(0, 7fr)' },
            alignItems: 'center',
          }}
        >
          <Box>
            <SectionHead title="RPI, Troy, New York" size="sm" />
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <PlaceOutlined sx={{ color: 'text.secondary', mt: 0.25 }} />
              <Typography color="text.secondary">
                Our lab is located within the <strong>Department of Cognitive Science</strong> and the{' '}
                <strong>Center for Industrial Innovation</strong> on the {institution} campus.
              </Typography>
            </Stack>
            <Button
              component="a"
              href={`mailto:${contactEmail}`}
              variant="outlined"
              color="inherit"
              startIcon={<EmailOutlined />}
              sx={{ mt: 3 }}
            >
              {contactEmail}
            </Button>
          </Box>
          <Box
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              lineHeight: 0,
            }}
          >
            <Box
              component="iframe"
              title={`${institution} map`}
              src={mapSrc}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sx={{ width: '100%', height: { xs: 300, md: 420 }, border: 0, display: 'block' }}
            />
          </Box>
        </Box>
      </Section>
    </>
  )
}
