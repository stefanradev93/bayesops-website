import { Box, Container, Divider, Stack, Typography } from '@mui/material'
import BrandLogo from './BrandLogo'
import SocialLinks from './SocialLinks'
import { TextLink } from './links'
import { footerNav, site } from '@/lib/site'

function FooterLink({ href, children }) {
  return (
    <TextLink
      href={href}
      sx={{
        fontSize: '0.9rem',
        color: 'text.secondary',
        width: 'fit-content',
        maxWidth: '100%',
        overflowWrap: 'anywhere',
      }}
    >
      {children}
    </TextLink>
  )
}

export default function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        pt: { xs: 6, md: 9 },
        bgcolor: 'surface.raised',
      }}
    >
      <Container>
        {/* Directory of the whole site, grouped the way the nav is grouped. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(max-content, 1fr) minmax(0, 3fr)' },
            gap: 6,
            justifyContent: 'space-between',
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <BrandLogo sx={{ width: 180, maxWidth: '100%', height: 'auto' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'nowrap', fontSize: '.875rem' }}>
              {site.subtitle}.
            </Typography>
          </Box>

          <Box component="nav" aria-label="Footer navigation" sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', columnGap: { xs: 1.5, sm: 3, md: 4 }, width: '100%', textAlign: 'left' }}>
              {footerNav.map((group) => (
                <Stack key={group.heading} spacing={1.25} sx={{ minWidth: 0, alignItems: 'flex-start', overflowWrap: 'anywhere' }}>
                  <Typography variant="overline" color="text.primary">
                    {group.heading}
                  </Typography>
                  {group.links.map((link) => (
                    <FooterLink key={`${group.heading}-${link.label}`} href={link.href}>
                      {link.label}
                    </FooterLink>
                  ))}
                </Stack>
              ))}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mt: { xs: 6, md: 8 } }} />

        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={2} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', py: 3 }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} {site.title}
          </Typography>
          <SocialLinks />
        </Stack>
      </Container>

    </Box>
  )
}
