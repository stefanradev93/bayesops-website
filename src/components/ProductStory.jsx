import { Box, Container, Stack, Typography } from '@mui/material'
import ArrowOutwardRounded from '@mui/icons-material/ArrowOutwardRounded'
import { ArrowLinkButton, LinkButton, TextLink } from './links'
import { assetUrl } from '@/lib/format'
import BayesFlowStory from './BayesFlowStory'
import CogFormerStory from './CogFormerStory'
import SuperstatsStory from './SuperstatsStory'
import CogFormerDesignCount from './CogFormerDesignCount'
import AnimatedStatNumber from './AnimatedStatNumber'
import ProductLogo from './ProductLogo'
import CollapsibleProductEmbed from './CollapsibleProductEmbed'
import { CaptionText, heroSx } from './PageElements'
import { productThemeSx } from '@/theme/productThemes'

const gradientText = {
  background: 'var(--product-heading-gradient, linear-gradient(105deg, var(--mui-palette-primary-main) 15%, var(--mui-palette-secondary-main) 95%))',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  // Paint below the tight line box so descenders stay inside the gradient.
  pb: '.15em',
  mb: '-.15em',
}

// Every product logo, mark or wordmark, shares this height.
const markSize = { xs: 32, md: 44 }
// Product pages read a little narrower than the site's 5vw gutter; phones keep 20px.
const productGutter = 'clamp(20px, 10vw - 36px, 216px)'
const scaleSize =(size, scale = 1) => Object.fromEntries(Object.entries(size).map(([breakpoint, px]) => [breakpoint, px * scale]))

/** Product messaging stays in content/product-stories.yaml. */
export default function ProductStory({ item, story, actions, schema }) {
  const feature = story.feature && (
    <Container component="section" aria-label={`Inside ${item.title}`} sx={{ py: { xs: 7, md: 12 } }}>
      {/* Wide figures, such as multi-panel diagrams, sit full width below the text. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: story.feature.layout === 'wide' ? 'minmax(0, 1fr)' : 'minmax(0, .9fr) minmax(0, 1.2fr)' }, gap: { xs: 5, md: story.feature.layout === 'wide' ? 6 : 9 }, alignItems: 'center' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="h2" sx={{ fontSize: { xs: '2.15rem', md: 'clamp(2.4rem, 3.2vw, 4rem)' }, textWrap: 'balance' }}>
            {story.feature.title}{' '}<Box component="span" sx={{ color: 'primary.main' }}>{story.feature.emphasis}</Box>
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 3, maxWidth: story.feature.layout === 'wide' ? 680 : 540 }}>{story.feature.body}</Typography>
        </Box>
        <Box component="figure" sx={{ m: 0, minWidth: 0, '& .feature-dark': { display: 'none' }, '.dark & .feature-dark': { display: 'block' }, '.dark & .feature-light': item.imageDark ? { display: 'none' } : {} }}>
          <Box component="img" className="feature-light" src={assetUrl(item.image)} alt={story.feature.alt || story.feature.caption} loading="lazy" width={story.feature.width || 1000} height={story.feature.height || 563} sx={{ display: 'block', width: '100%', height: 'auto' }} />
          {item.imageDark && <Box component="img" className="feature-dark" src={assetUrl(item.imageDark)} alt={story.feature.alt || story.feature.caption} loading="lazy" width={story.feature.width || 1000} height={story.feature.height || 563} sx={{ width: '100%', height: 'auto' }} />}
          {story.feature.caption && <Typography component="figcaption" color="text.secondary" sx={{ mt: 2, fontSize: '.75rem', lineHeight: 1.6 }}>{story.feature.caption}</Typography>}
        </Box>
      </Box>
    </Container>
  )

  return (
    <Box component="article" data-product-story={item.slug} sx={{ ...productThemeSx[item.slug], '& .MuiContainer-root': { paddingLeft: productGutter, paddingRight: productGutter } }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {/* Headline and wordmark scale with viewport height so the header ends at
          the same mid-screen divider as the other top-level pages. */}
      {/* Even padding and flex centring sit the text on the banner's horizontal midline. */}
      <Box component="header" sx={{ ...heroSx, py: { xs: 4, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Container>
          {story.category && <Typography component="p" sx={{ mb: 2, color: 'text.secondary', fontSize: '.8rem', fontFamily: 'var(--font-mono)' }}>{story.category}</Typography>}
          {/* Side by side, the wordmark takes the first row and the headline shares
              the second with the intro, so the two blocks centre on each other. */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.5fr) minmax(320px, 1fr)' }, gridTemplateRows: { lg: 'auto auto' }, columnGap: 8, rowGap: { xs: 4, lg: 3 }, alignItems: 'center' }}>
            <Typography component="h1" variant="h1" sx={{ minWidth: 0, gridRow: { lg: '1 / span 2' }, display: { lg: 'grid' }, gridTemplateRows: { lg: 'subgrid' }, alignItems: 'center', fontSize: { xs: 'clamp(2.4rem, 8.2vw, 3.6rem)', md: 'clamp(3rem, min(5.1vw, 7.6svh), 6.5rem)' }, fontWeight: 450, lineHeight: 1.08, textWrap: 'balance' }}>
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 3, lg: 0 }, fontSize: { xs: '1.45rem', md: '1.8rem' }, fontWeight: 400, letterSpacing: '-.025em' }}>
                {story.wordmark ? (
                  <Box component="span" role="img" aria-label={item.title} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, maxWidth: '100%' }}>
                    {story.wordmark.retainLogo && (story.logo || item.icon) && <ProductLogo src={story.logo || item.icon} darkSrc={item.iconDark} whiteInDark={item.iconWhiteInDark} sx={{ width: markSize, height: markSize }} />}
                    {/* Wordmarks take the logo height; `scale` shrinks lettering set beside a mark. */}
                    <ProductLogo src={story.wordmark.src} darkSrc={story.wordmark.darkSrc} sx={{ height: scaleSize(markSize, story.wordmark.scale), maxWidth: '100%', minWidth: 0, flexShrink: 1, aspectRatio: `${story.wordmark.width} / ${story.wordmark.height}` }} />
                  </Box>
                ) : (
                  <>
                    {(story.logo || item.icon) && <ProductLogo src={story.logo || item.icon} darkSrc={item.iconDark} whiteInDark={item.iconWhiteInDark} sx={{ width: markSize, height: markSize }} />}
                    {item.title}
                  </>
                )}
              </Box>{' '}
              <Box component="span" sx={{ display: 'block' }}>
                {story.headline.map((line, index) => (
                  <Box component="span" key={index} sx={{ display: 'block', textWrap: 'balance', ...(index === story.headline.length - 1 && gradientText) }}>
                    {(Array.isArray(line) ? line : line.split(' ')).map((phrase, phraseIndex) => (
                      <Box component="span" key={phraseIndex}>{phraseIndex > 0 && ' '}<Box component="span" sx={{ whiteSpace: 'nowrap' }}>{phrase}</Box></Box>
                    ))}{' '}
                  </Box>
                ))}
              </Box>
            </Typography>
            <Box sx={{ minWidth: 0, maxWidth: { xs: 720, lg: 'none' }, gridRow: { lg: 2 } }}>
              <Typography component="p" color="text.secondary" sx={{ fontSize: { xs: '1.05rem', md: '1.15rem' }, lineHeight: { xs: 1.7, lg: 1.6 }, textWrap: 'pretty' }}><CaptionText text={story.intro} breakAfter={story.introBreakAfter} /></Typography>
              <Stack direction="row" sx={{ mt: { xs: 3.5, lg: 3 }, gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                {actions.map((action, index) => index === 0 ? (
                  <LinkButton key={action.href} href={action.href} variant="contained" endIcon={<ArrowOutwardRounded />} sx={{ px: 2.5, py: 1.5 }}>{action.label}</LinkButton>
                ) : (
                  <ArrowLinkButton key={action.href} href={action.href} accent="primary" sx={{ px: 0 }}>{action.label}</ArrowLinkButton>
                ))}
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Products still in development lead with their feature, ahead of the status. */}
      {story.comingSoon && feature}

      {/* The hero and highlights share the first screen, split at the mid-screen divider. */}
      {item.slug !== 'superstats' && <Box component="section" aria-label={story.comingSoon ? `${item.title} status` : `${item.title} highlights`} sx={{ bgcolor: 'surface.raised', py: { xs: 6, md: 8 }, minHeight: '50svh', display: 'flex', alignItems: 'center' }}>
        <Container>
          {story.comingSoon ? (
            <Box data-product-coming-soon>
              <Typography component="h2" sx={{ fontFamily: 'var(--font-display)', fontSize: { xs: '3.4rem', md: 'clamp(4rem, 7vw, 7rem)' }, letterSpacing: '-.045em', lineHeight: 1.05, fontWeight: 450, ...gradientText }}>Coming soon.</Typography>
              <Typography color="text.secondary" sx={{ mt: 3, maxWidth: 560, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>{story.comingSoon}</Typography>
            </Box>
          ) : story.designCount ? (
            <CogFormerDesignCount {...story.designCount} />
          ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 5, md: 6 } }}>
            {story.highlights.map((highlight) => {
              const title = <>
                <Box component="span" sx={{ display: 'block', color: 'primary.main', mb: 2, fontSize: highlight.value.length <= 3 ? { xs: '4.5rem', md: '6rem' } : { xs: '2.6rem', md: 'clamp(2.4rem, 3.5vw, 4.2rem)' } }}>{['bayesflow', 'bayesify'].includes(item.slug) ? <AnimatedStatNumber value={highlight.value} animationKey={`${item.slug}-${highlight.label}`} /> : highlight.value}</Box>{' '}
                <Box component="span" sx={{ display: 'block', fontSize: { xs: '1.3rem', md: '1.45rem' }, letterSpacing: '-.025em', lineHeight: 1.25 }}>{highlight.label}</Box>
              </>

              return (
                <Box key={highlight.label} data-product-highlight sx={{ minWidth: 0 }}>
                  <Typography component="h2" sx={{ fontFamily: 'var(--font-display)', letterSpacing: '-.045em', lineHeight: 1.05, fontWeight: 450 }}>
                    {highlight.href ? <TextLink href={highlight.href} sx={{ display: 'block', width: 'fit-content' }}>{title}</TextLink> : title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 380, fontSize: '.95rem' }}>
                    {highlight.detail}
                    {highlight.source && <>{' '}<TextLink href={`#product-source-${highlight.source}`} aria-label={`Source ${highlight.source} for ${highlight.label}`} sx={{ color: 'primary.main', fontSize: '.75rem', verticalAlign: 'super' }}>[{highlight.source}]</TextLink></>}
                  </Typography>
                </Box>
              )
            })}
          </Box>
          )}
        </Container>
      </Box>}

      {item.slug === 'superstats' ? (
        <SuperstatsStory sections={story.sections} />
      ) : item.slug === 'bayesflow' ? (
        <BayesFlowStory sections={story.sections} />
      ) : item.slug === 'cogformer' ? (
        <CogFormerStory sections={story.sections} demoUrl={item.link} />
      ) : !story.comingSoon && feature}

      {story.embed && (
        <Box component="section" aria-label={`Use ${item.title}`} sx={{ pb: { xs: 7, md: 12 } }}>
          <Container>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: { xs: 6, md: 9 }, mb: 4 }}>
              <Typography component="h2" variant="h2" sx={{ fontSize: { xs: '2.15rem', md: 'clamp(2.4rem, 3.2vw, 4rem)' } }}>{story.embed.heading}</Typography>
              <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 680 }}>{story.embed.body}</Typography>
            </Box>
          </Container>
          <CollapsibleProductEmbed href={story.embed.href} title={story.embed.title} />
        </Box>
      )}

      <Container sx={{ pt: story.sources ? 0 : { xs: 6, md: 9 }, pb: { xs: 6, md: 9 } }}>
        {story.sources && <Box component="section" aria-label="Documentation and evidence" sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography component="h2" sx={{ fontSize: '.85rem', fontWeight: 500, mb: 2 }}>Documentation &amp; evidence</Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 3, color: 'text.secondary', fontSize: '.8rem' }}>
            {story.sources.map((source, index) => (
              <Box component="li" id={`product-source-${index + 1}`} key={source.href} sx={{ pl: .5, pr: { md: 4 } }}>
                <TextLink href={source.href} sx={{ color: 'text.primary', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{source.label}</TextLink>
                <Typography sx={{ fontSize: 'inherit', mt: .75, lineHeight: 1.6 }}>{source.note}</Typography>
              </Box>
            ))}
          </Box>
        </Box>}
        <Box sx={{ mt: story.sources ? 5 : 0 }}><ArrowLinkButton href="/products" accent="primary" sx={{ px: 0 }}>All products</ArrowLinkButton></Box>
      </Container>
    </Box>
  )
}
