import { Box, Breadcrumbs, Chip, Container, Stack, Typography } from '@mui/material'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowOutwardRounded from '@mui/icons-material/ArrowOutwardRounded'
import MarkdownContent from './MarkdownContent'
import { LinkButton, TextLink } from './links'
import { assetUrl } from '@/lib/format'

/** Shared detail-page shell for papers, projects, and products. */
export default function CollectionDetail({
  item,
  collectionHref,
  collectionLabel,
  eyebrow,
  byline,
  actions = [],
  actionsAside = false,
  schema,
}) {
  const actionButtons = actions.map((action, index) => (
    <LinkButton
      key={`${action.label}-${action.href}`}
      href={action.href}
      variant={index === 0 ? 'contained' : 'outlined'}
      color={index === 0 ? 'primary' : 'inherit'}
      endIcon={<ArrowOutwardRounded />}
    >
      {action.label}
    </LinkButton>
  ))
  const backButton = (
    <LinkButton
      href={collectionHref}
      startIcon={<ArrowBackRounded />}
      color="inherit"
      sx={actionsAside ? { justifyContent: 'flex-start', px: 1 } : { ml: -1 }}
    >
      Back to {collectionLabel.toLowerCase()}
    </LinkButton>
  )

  return (
    <Container sx={{ pt: { xs: 4, md: 7 }, pb: { xs: 6, md: 9 } }}>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}

      <Breadcrumbs sx={{ mb: { xs: 4, md: 6 }, fontSize: '0.9rem', '& .MuiBreadcrumbs-li': { minWidth: 0, maxWidth: '100%' } }}>
        <TextLink href={collectionHref} sx={{ color: 'text.secondary' }}>
          {collectionLabel}
        </TextLink>
        <Typography color="text.primary" fontSize="0.9rem" noWrap sx={{ maxWidth: 420 }}>
          {item.title}
        </Typography>
      </Breadcrumbs>

      <Box
        component="article"
        sx={{
          display: 'grid',
          gridTemplateAreas: actionsAside
            ? { xs: '"media" "heading" "body" "aside"', md: '"aside media" "aside heading" "aside body"' }
            : '"media" "heading" "body" "actions" "back"',
          gridTemplateColumns: actionsAside
            ? { xs: 'minmax(0, 1fr)', md: '190px minmax(0, 920px)' }
            : 'minmax(0, 1fr)',
          columnGap: actionsAside ? { md: 6 } : 0,
          rowGap: { xs: 4, md: 4.5 },
          alignItems: 'start',
          width: '100%',
          maxWidth: actionsAside ? 1160 : 920,
          mx: 'auto',
        }}
      >
        <Box sx={{ gridArea: 'heading', minWidth: 0 }}>
          {eyebrow && (
            <Typography variant="overline" color="text.secondary" component="p">
              {eyebrow}
            </Typography>
          )}
          <Typography
            component="h1"
            variant="h1"
            sx={{ mt: eyebrow ? 1.5 : 0, fontSize: { xs: '2.45rem', md: '3.75rem' } }}
          >
            {item.title}
          </Typography>

          {byline && (
            <Typography color="text.secondary" sx={{ mt: 3, fontSize: '1rem', lineHeight: 1.7 }}>
              {byline}
            </Typography>
          )}
        </Box>

        {item.image && (
          <Box
            sx={{
              gridArea: 'media',
              ...(item.imagePresentation === 'logo' && {
                p: { xs: 3, sm: 5, md: 6 },
                bgcolor: '#fff',
              }),
            }}
          >
            <Box
              component="img"
              src={assetUrl(item.image)}
              alt=""
              sx={{
                display: 'block',
                width: '100%',
                height: 'auto',
                maxHeight: actionsAside ? 'none' : 430,
                objectFit: 'contain',
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            gridArea: 'body',
            minWidth: 0,
            pt: { md: 1 },
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ pt: 3 }}>
            <MarkdownContent>{item.description || ''}</MarkdownContent>
          </Box>

          {(item.tags || []).length > 0 && (
            <Stack direction="row" sx={{ mt: 4, gap: 1, flexWrap: 'wrap' }}>
              {item.tags.map((tag) => (
                <Chip key={tag} label={tag} variant="outlined" />
              ))}
            </Stack>
          )}
        </Box>

        {actionsAside && (
          <Stack
            spacing={2}
            sx={{
              gridArea: 'aside',
              position: { md: 'sticky' },
              top: { md: 104 },
              alignItems: 'stretch',
            }}
          >
            {actionButtons}
            <Box sx={{ pt: 1.5 }}>
              {backButton}
            </Box>
          </Stack>
        )}

        {!actionsAside && actions.length > 0 && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.25}
            sx={{ gridArea: 'actions', alignItems: { xs: 'stretch', sm: 'center' }, pt: 1 }}
          >
            {actionButtons}
          </Stack>
        )}

        {!actionsAside && <Box sx={{ gridArea: 'back', pt: 1 }}>{backButton}</Box>}
      </Box>
    </Container>
  )
}
