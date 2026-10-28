'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Box, Chip, Stack, Typography } from '@mui/material'
import ArrowOutwardRounded from '@mui/icons-material/ArrowOutwardRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import ArticleRounded from '@mui/icons-material/ArticleRounded'
import HubRounded from '@mui/icons-material/HubRounded'
import AppsRounded from '@mui/icons-material/AppsRounded'
import { assetUrl, publicationYear, roleLabel } from '@/lib/format'
import { neonIconFilter } from '@/theme/effects'
import ProductLogo from './ProductLogo'

/**
 * An open editorial entry. A single rule and typography establish hierarchy.
 */
export function Tile({ href, external, children, sx, neonDivider = true }) {
  const props = external
    ? { component: 'a', href, target: '_blank', rel: 'noreferrer' }
    : { component: Link, href }

  return (
    <Box
      {...props}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        pt: 3,
        pb: 2,
        position: 'relative',
        borderTop: '1px solid',
        borderColor: 'divider',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color .2s ease',
        // Neon rules over this tile's divider and the next row's, which sits one grid gap below.
        '&::before, &::after': {
          content: '""',
          display: neonDivider ? 'block' : 'none',
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: 1,
          height: '1px',
          background: 'linear-gradient(90deg, var(--mui-palette-secondary-main), var(--mui-palette-primary-main))',
          boxShadow: '0 0 12px color-mix(in srgb, var(--mui-palette-primary-main) 55%, transparent)',
          opacity: 0,
          transition: 'opacity .18s ease',
        },
        '&::before': { top: '-1px' },
        '&::after': { bottom: 'calc(-1px - var(--tile-gap, 0px))', visibility: 'var(--tile-divider-below, visible)' },
        '&:hover, &:focus-visible': { borderColor: neonDivider ? 'primary.main' : 'divider' },
        '&:hover::before, &:focus-visible::before, &:hover::after, &:focus-visible::after': { opacity: 1 },
        '&:hover .tile-arrow, &:focus-visible .tile-arrow': { transform: 'translate(2px, -2px)', color: 'primary.main', filter: neonIconFilter },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

/** Shared landscape frame matches BayesFlow's 1000 × 563 image. */
export function TileMedia({ src, darkSrc, alt = '', ratio = '1000 / 563', sizes = '(max-width: 900px) 100vw, 33vw', fit = 'cover', position = 'center', scale = 1, sx }) {
  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        width: '100%',
        aspectRatio: ratio,
        overflow: 'hidden',
        bgcolor: 'transparent',
        flexShrink: 0,
        ...(darkSrc && {
          '& .tile-media-light': {
            ...theme.applyStyles('dark', { display: 'none' }),
          },
          '& .tile-media-dark': {
            display: 'none',
            ...theme.applyStyles('dark', { display: 'block' }),
          },
        }),
        ...sx,
      })}
    >
      <Image
        className="tile-media-light"
        src={assetUrl(src)}
        alt={alt}
        fill
        sizes={sizes}
        style={{ objectFit: fit, objectPosition: position, ...(scale !== 1 && { transform: `scale(${scale})`, transformOrigin: position }) }}
      />
      {darkSrc && (
        <Image
          className="tile-media-dark"
          src={assetUrl(darkSrc)}
          alt={alt}
          fill
          sizes={sizes}
          style={{ objectFit: fit, objectPosition: position, ...(scale !== 1 && { transform: `scale(${scale})`, transformOrigin: position }) }}
        />
      )}
    </Box>
  )
}

export function TileBody({ children, sx }) {
  return (
    <Stack sx={{ flex: 1, minWidth: 0, pt: 3, pb: 2, ...sx }}>{children}</Stack>
  )
}

export function TileEyebrow({ children, size = '0.65rem' }) {
  return (
    <Typography
      variant="overline"
      component="p"
      sx={{
        mb: 1,
        width: 'fit-content',
        color: 'transparent',
        background: 'linear-gradient(90deg, var(--mui-palette-secondary-main), var(--mui-palette-primary-main))',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: 'var(--font-mono)',
        fontWeight: 400,
        fontSize: size,
      }}
    >
      {children}
    </Typography>
  )
}

export function TileTitle({ children, size = '1.35rem', component = 'h3' }) {
  return (
    <Typography className="tile-title" component={component} sx={{ fontFamily: 'var(--font-display)', fontWeight: 450, letterSpacing: '-0.018em', fontSize: size, lineHeight: 1.24 }}>
      {children}
    </Typography>
  )
}

export function TileArrow({ external = false, sx }) {
  const Icon = external ? ArrowOutwardRounded : ArrowForwardRounded
  return (
    <Icon
      className="tile-arrow"
      fontSize="small"
      sx={{ flexShrink: 0, color: 'text.secondary', transition: 'transform .2s ease, color .18s ease, filter .18s ease', ...sx }}
    />
  )
}

export function TagRow({ tags = [], max = 3 }) {
  if (!tags.length) return null
  return (
    <Stack direction="row" sx={{ mt: 2, gap: 0.75, flexWrap: 'wrap' }}>
      {tags.slice(0, max).map((tag) => (
        <Chip key={tag} component="span" label={tag} title={tag} size="small" variant="outlined" sx={{ maxWidth: '100%', color: 'text.secondary', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 400 }} />
      ))}
      {tags.length > max && (
        <Chip component="span" label={`+${tags.length - max}`} title={tags.slice(max).join(', ')} size="small" variant="outlined" sx={{ color: 'text.secondary', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 400 }} />
      )}
    </Stack>
  )
}

const fallbackIcons = {
  paper: ArticleRounded,
  project: HubRounded,
  product: AppsRounded,
  app: AppsRounded,
}

/**
 * Small collection mark. Add `icon: images/icons/example.svg` to an item's
 * YAML entry to replace the restrained fallback with its final custom icon.
 */
export function ContentIcon({ item, kind = 'project' }) {
  const FallbackIcon = fallbackIcons[kind] || HubRounded

  return (
    <Box
      aria-hidden="true"
      sx={{
        display: 'grid',
        placeItems: 'center',
        width: { xs: 48, sm: 56 },
        height: { xs: 48, sm: 56 },
        flexShrink: 0,
        overflow: 'hidden',
        color: kind === 'paper' ? 'secondary.main' : 'primary.main',
      }}
    >
      {item.icon ? (
        <ProductLogo
          src={item.icon}
          darkSrc={item.iconDark}
          whiteInDark={item.iconWhiteInDark}
          sx={{ width: '72%', height: '72%' }}
        />
      ) : (
        <FallbackIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
      )}
    </Box>
  )
}

/** Compact icon-led entry for the research, project, and product indexes. */
export function CollectionTile({ item, href, kind = 'project', eyebrow, eyebrowSize, byline, showDescription = true }) {
  return (
    <Tile href={href} sx={{ py: { xs: 3, sm: 4 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '48px minmax(0, 1fr)', sm: '56px minmax(0, 1fr) auto' },
          columnGap: { xs: 2, sm: 2.5 },
          alignItems: 'start',
        }}
      >
        <ContentIcon item={item} kind={kind} />
        <Box sx={{ minWidth: 0 }}>
          {eyebrow && <TileEyebrow size={eyebrowSize}>{eyebrow}</TileEyebrow>}
          <TileTitle size={{ xs: '1.15rem', sm: '1.3rem' }}>{item.title}</TileTitle>
          {byline && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
              {byline}
            </Typography>
          )}
          {showDescription && <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1.25,
              maxWidth: '78ch',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description}
          </Typography>}
          <TagRow tags={item.tags} />
        </Box>
        <TileArrow
          sx={{
            mt: 0.25,
            display: { xs: 'none', sm: 'block' },
          }}
        />
      </Box>
    </Tile>
  )
}

// ---------------------------------------------------------------------------

export function ProjectTile({ item, href, neonDivider = true, textFirst = false }) {
  const media = <TileMedia src={item.image} darkSrc={item.imageDark} fit={item.imageFit || 'contain'} position={item.imagePosition || 'center'} />

  return (
    <Tile href={href || item.link} external={!href} neonDivider={neonDivider}>
      {!textFirst && media}
      <TileBody sx={textFirst ? { pt: 0, pb: 3 } : undefined}>
        <TileEyebrow>{item.subtitle}</TileEyebrow>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <TileTitle>{item.title}</TileTitle>
          <TileArrow external={!href} sx={{ mt: 0.5 }} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {item.description}
        </Typography>
        <Box sx={{ mt: 'auto' }}>
          <TagRow tags={item.tags} />
        </Box>
      </TileBody>
      {textFirst && media}
    </Tile>
  )
}

export function MemberTile({ member }) {
  return (
    <Tile href={`/members/${member.slug}`} sx={{ borderTop: 0, pt: 0, '&::before, &::after': { display: 'none' } }}>
      <TileMedia
        src={member.image}
        alt={member.name}
        ratio="1 / 1"
        sizes="(max-width: 599px) 45vw, (max-width: 899px) 30vw, (max-width: 1199px) 23vw, 16vw"
        position={member.imagePosition}
        scale={member.imageScale}
        sx={{ width: '100%', border: 0, borderRadius: { xs: '12px', sm: '16px' } }}
      />
      <TileBody sx={{ pt: 2 }}>
        <TileTitle size="1.2rem">{member.name}</TileTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {roleLabel(member)}
        </Typography>
        {member.institution && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, opacity: 0.8 }}>
            {member.institution}
          </Typography>
        )}
      </TileBody>
    </Tile>
  )
}

export function PublicationTile({ publication }) {
  return (
    <CollectionTile
      item={publication}
      href={`/research/${publication.slug}`}
      kind="paper"
      showDescription={false}
      eyebrow={[publication.publisher, publicationYear(publication)].filter(Boolean).join(' · ')}
      byline={`${(publication.authors || []).slice(0, 4).join(', ')}${
        (publication.authors || []).length > 4 ? ', et al.' : ''
      }`}
    />
  )
}
