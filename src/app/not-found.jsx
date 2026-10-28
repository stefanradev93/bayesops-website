import { Container, Stack, Typography } from '@mui/material'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import SiteSearch from '@/components/SiteSearch'
import { LinkButton } from '@/components/links'
import { getSearchIndex } from '@/lib/content'
import { nav } from '@/lib/site'

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 10, md: 16 } }}>
      <Typography variant="overline" color="text.secondary" component="p">
        404 · Page not found
      </Typography>
      <Typography
        component="h1"
        variant="h1"
        sx={{ mt: 1.5, mb: 2.5, fontSize: { xs: '2.8rem', md: '4.4rem' } }}
      >
        This path doesn’t compute.
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 520 }}>
        Search the whole site for the content you want, or pick up one of the trails below.
      </Typography>

      <SiteSearch index={getSearchIndex()} />

      <Stack direction="row" sx={{ mt: 5, gap: 1, flexWrap: 'wrap' }}>
        <LinkButton href="/" startIcon={<HomeOutlined />} color="inherit" variant="outlined">
          Home
        </LinkButton>
        {nav.map((item) => (
          <LinkButton key={item.href} href={item.href} color="inherit" variant="outlined">
            {item.label}
          </LinkButton>
        ))}
      </Stack>

    </Container>
  )
}
