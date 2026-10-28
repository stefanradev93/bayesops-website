import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Box, Breadcrumbs, Container, Stack, Typography } from '@mui/material'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowOutwardRounded from '@mui/icons-material/ArrowOutwardRounded'
import MarkdownContent from '@/components/MarkdownContent'
import { LinkButton, TextLink } from '@/components/links'
import { assetUrl, getMember, getMembers, linkTypes, roleLabel } from '@/lib/content'
import { site, socialImage } from '@/lib/site'
import { linkHoverSx } from '@/theme/effects'

export function generateStaticParams() {
  return getMembers().map((member) => ({ slug: member.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const member = getMember(slug)
  if (!member) return {}

  const description = `${roleLabel(member)}${member.institution ? ` at ${member.institution}` : ` in the ${site.title} lab`}.`
  return {
    title: member.name,
    description,
    alternates: { canonical: `/members/${member.slug}` },
    openGraph: {
      type: 'profile',
      title: member.name,
      description: site.description,
      url: `/members/${member.slug}`,
      images: [socialImage],
    },
  }
}

export default async function MemberPage({ params }) {
  const { slug } = await params
  const member = getMember(slug)
  if (!member) notFound()

  const links = Object.entries(member.links || {}).filter(([type, value]) => linkTypes[type] && value)
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.name,
    jobTitle: roleLabel(member),
    image: `${site.url}${assetUrl(member.image)}`,
    url: `${site.url}/members/${member.slug}`,
    affiliation: { '@type': 'Organization', name: member.institution || site.title },
  }

  return (
    <Container sx={{ pt: { xs: 4, md: 7 }, pb: { xs: 6, md: 8 } }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <Breadcrumbs sx={{ mb: { xs: 4, md: 6 }, fontSize: '0.9rem' }}>
        <TextLink href="/team" sx={{ color: 'text.secondary' }}>
          Team
        </TextLink>
        <Typography color="text.primary" fontSize="0.9rem">
          {member.name}
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 5, md: 8 },
          gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 320px) minmax(0, 1fr)' },
          alignItems: 'start',
        }}
      >
        <Box sx={{ position: { md: 'sticky' }, top: { md: 104 } }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'surface.raised',
            }}
          >
            <Image
              src={assetUrl(member.image)}
              alt={member.name}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 320px"
              style={{ objectFit: 'cover', objectPosition: member.imagePosition || 'center', ...(member.imageScale && { transform: `scale(${member.imageScale})`, transformOrigin: member.imagePosition || 'center' }) }}
            />
          </Box>

          {links.length > 0 && (
            <Stack sx={{ mt: 3 }}>
              <Typography variant="overline" color="text.secondary" component="p" sx={{ mb: 1 }}>
                Elsewhere
              </Typography>
              {links.map(([type, value]) => (
                <Box
                  key={type}
                  component="a"
                  href={linkTypes[type].url(String(value))}
                  target={type === 'email' ? undefined : '_blank'}
                  rel="noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    py: 1.25,
                    fontSize: '0.9rem',
                    color: 'text.secondary',
                    textDecoration: 'none',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    ...linkHoverSx,
                    '&:hover svg': { transform: 'translate(2px, -2px)' },
                  }}
                >
                  {linkTypes[type].label}
                  <ArrowOutwardRounded sx={{ fontSize: 16, transition: 'transform .2s ease' }} />
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary" component="p">
            {roleLabel(member)}
            {member.institution ? ` · ${member.institution}` : ''}
          </Typography>
          <Typography
            component="h1"
            variant="h1"
            sx={{ mt: 1.5, mb: 4, fontSize: { xs: '2.6rem', md: '4rem' } }}
          >
            {member.name}
          </Typography>
          <MarkdownContent>{member.body}</MarkdownContent>
          <LinkButton
            href="/team"
            startIcon={<ArrowBackRounded />}
            color="inherit"
            sx={{ mt: 5, ml: -1 }}
          >
            Back to the team
          </LinkButton>
        </Box>
      </Box>
    </Container>
  )
}
