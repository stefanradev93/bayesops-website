import { Box, Container, Stack, Typography } from '@mui/material'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import { ArrowLinkButton, LinkButton } from '@/components/links'
import { CaptionText, Section, SectionHead, TileGrid } from '@/components/PageElements'
import { ProjectTile, Tile, TileBody, TileMedia, TileTitle } from '@/components/Tiles'
import DiffusionField from '@/components/DiffusionField'
import ScientificField from '@/components/ScientificField'
import NewsTimeline from '@/components/NewsTimeline'
import { getNews, getProducts } from '@/lib/content'

export const metadata = {
  alternates: { canonical: '/' },
}

const pillars = [
  {
    title: 'Our Research',
    text: 'We develop, validate, and apply Bayesian methods for fast statistical workflows.',
    image: '/images/index/forward-inverse.svg',
    imageDark: '/images/index/forward-inverse-dark.svg',
    imageFit: 'contain',
    href: '/research',
  },
  {
    title: 'Our Products',
    text: 'We create novel software and deploy neural architectures for efficient Bayesian modeling.',
    image: '/images/projects/bayesflow.png',
    imageDark: '/images/projects/bayesflow-dark.png',
    href: '/products',
  },
  {
    title: 'Our Team',
    text: 'We bring together scholars from around the world to advance collaborative research.',
    image: '/images/index/team.png',
    href: '/team',
  },
]

export default function HomePage() {
  const news = getNews()
  const products = getProducts().slice(0, 3)

  return (
    <>
      <Box
        component="header"
        sx={{
          position: 'relative',
          isolation: 'isolate',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          // Fill the viewport below the sticky header so the next section never peeks in.
          minHeight: { xs: 'calc(100svh - 64px)', md: 'calc(100svh - 72px)' },
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: { xs: 0, md: '0 3% 0 40%' },
            opacity: { xs: 0.55, md: 1 },
            pointerEvents: 'none',
            maskImage: {
              xs: 'linear-gradient(90deg, transparent, rgb(0 0 0 / 0.55) 35%, #000)',
              md: 'linear-gradient(90deg, transparent, #000 40%)',
            },
          }}
        >
          <DiffusionField />
        </Box>
        <Container sx={{ position: 'relative', py: { xs: 6, md: 9 } }}>
          <Typography
            component="h1"
            variant="h1"
            sx={{ maxWidth: 1100, fontWeight: 450, fontSize: { xs: 'clamp(2rem, 8.3vw, 3.5rem)', sm: 'clamp(3rem, 6vw, 4.5rem)', md: 'clamp(3.75rem, 5.2vw, 6.5rem)' } }}
          >
            Where AI meets
            <Box component="span" sx={{ display: 'block', color: 'primary.main' }}>
              Bayesian statistics
            </Box>
          </Typography>
          <Box sx={{ mt: { xs: 4, md: 5 } }}>
            <Typography component="p" color="text.secondary" sx={{ maxWidth: 840, fontSize: { xs: '1.08rem', md: '1.2rem' }, lineHeight: 1.7 }}>
              <CaptionText text="We build fast Bayesian methods for the age of AI that transcend disciplines and live beyond the words of a paper." breakAfter="transcend disciplines" />
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-start' }}>
              <LinkButton href="/research" size="large" endIcon={<ArrowForwardRounded />} sx={{ bgcolor: 'text.primary', color: 'background.default', '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' } }}>
                Explore our research
              </LinkButton>
              <ArrowLinkButton href="/team">Meet the team</ArrowLinkButton>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Section id="lab" sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 9, md: 15 }, bgcolor: 'surface.raised', '.dark &': { bgcolor: 'transparent' } }}>
        <SectionHead
          title="Ideas, tools, and people"
          description={<CaptionText text="Our work spans methodological research, open-source infrastructure, and collaborations across scientific domains." breakAfter="open-source infrastructure," />}
        />
        <TileGrid columns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }} gap={{ xs: 4, md: 6 }}>
          {pillars.map((pillar) => (
            <Tile key={pillar.title} href={pillar.href} neonDivider={false}>
              <TileMedia src={pillar.image} darkSrc={pillar.imageDark} fit={pillar.imageFit} />
              <TileBody>
                <TileTitle size="1.5rem">{pillar.title}</TileTitle>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{pillar.text}</Typography>
              </TileBody>
            </Tile>
          ))}
        </TileGrid>
      </Section>

      <Section id="news">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 4, md: 6 }, alignItems: 'start' }}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 112 }, minWidth: 0 }}>
            <SectionHead title="Latest news" />
            <ArrowLinkButton href="/news" accent="primary" sx={{ px: 0 }}>All news</ArrowLinkButton>
          </Box>
          <Box sx={{ minWidth: 0, gridColumn: { md: '2 / -1' } }}><NewsTimeline entries={news} alignAxis /></Box>
        </Box>
      </Section>

      <Section
        sx={{
          position: 'relative',
          isolation: 'isolate',
          overflow: 'hidden',
          bgcolor: '#24242F',
          color: '#F1EFEA',
          '--mui-palette-text-primary': '#F1EFEA',
          '--mui-palette-text-secondary': '#B1AEBE',
          '--mui-palette-primary-main': '#AF91FF',
          '--mui-palette-secondary-main': '#FF80BF',
          '--mui-palette-divider': 'rgba(241,239,234,0.2)',
          '--mui-palette-surface-raised': '#2D2D3A',
        }}
      >
        <ScientificField sx={{ position: 'absolute', width: { xs: '150%', md: '75%' }, height: '110%', right: '-22%', top: '-14%', color: 'primary.main', opacity: 0.35, zIndex: -1 }} />
        <SectionHead
          title="What we build"
          action={<ArrowLinkButton href="/products" accent="primary" idleColor="text.primary" arrowColor="#24242F">All products</ArrowLinkButton>}
        />
        <TileGrid columns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }} gap={{ xs: 4, md: 6 }}>
          {products.map((product) => <ProjectTile key={product.slug} item={product} href={`/products/${product.slug}`} neonDivider={false} />)}
        </TileGrid>
      </Section>
    </>
  )
}
