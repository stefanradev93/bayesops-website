'use client'

import { useMemo, useState } from 'react'
import { Box, Button, ButtonBase, Chip, Stack, Typography } from '@mui/material'
import SearchField from './SearchField'
import { PublicationTile } from './Tiles'
import { TextLink } from './links'
import { publicationYear } from '@/lib/format'
import { social } from '@/lib/site'

const TAG_LIMIT = 12
const GOOGLE_SCHOLAR_URL = social.find((item) => item.type === 'google-scholar').href

/** Search, year, and topic filters over chronologically ordered papers. */
export default function PublicationBrowser({ citations }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [year, setYear] = useState(null)
  const years = useMemo(() => [...new Set(citations.map(publicationYear).filter(Boolean))].sort((a, b) => b - a), [citations])

  // Most-used tags first, so the filter row leads with the lab's main themes.
  const tags = useMemo(() => {
    const counts = new Map()
    for (const item of citations) {
      for (const value of item.tags || []) counts.set(value, (counts.get(value) || 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value]) => value)
  }, [citations])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return citations.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.publisher,
        publicationYear(item),
        ...(item.authors || []),
        ...(item.tags || []),
      ]
        .join(' ')
        .toLowerCase()
      return (!needle || haystack.includes(needle)) && (!tag || (item.tags || []).includes(tag)) && (!year || publicationYear(item) === year)
    }).sort((a, b) => {
      const order = (a.date || '').localeCompare(b.date || '')
      return (year ? order : -order) || a.title.localeCompare(b.title)
    })
  }, [citations, query, tag, year])

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(280px, 440px)' }, alignItems: 'center', gap: { xs: 2.5, md: 4 }, mb: 4 }}>
        <Typography component="h2" variant="h2" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>Recent papers</Typography>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by title, author, topic, or year…"
          label="Search publications"
          maxWidth="none"
        />
        <Typography color="text.secondary" sx={{ gridColumn: '1 / -1', mt: { md: -2 } }}>
          A representative sample of our recent research outcomes. Visit{' '}
          <TextLink href={GOOGLE_SCHOLAR_URL} sx={{ display: 'inline', color: 'text.primary', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Google Scholar</TextLink>{' '}
          for all of our preprints and publications.
        </Typography>
      </Box>

      <Stack direction="row" role="group" aria-label="Filter publications by topic" sx={{ mt: 2.5, gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="All topics"
          aria-pressed={!tag}
          onClick={() => setTag('')}
          variant={tag ? 'outlined' : 'filled'}
          color={tag ? 'default' : 'primary'}
        />
        {tags.slice(0, TAG_LIMIT).map((value) => (
          <Chip
            key={value}
            label={value}
            aria-pressed={tag === value}
            onClick={() => setTag(tag === value ? '' : value)}
            variant={tag === value ? 'filled' : 'outlined'}
            color={tag === value ? 'primary' : 'default'}
          />
        ))}
      </Stack>

      <Box role="status" sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}>
        {year ? `Papers from ${year}` : 'All publication years'}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '64px minmax(0, 1fr)', sm: '100px minmax(0, 1fr)', md: '144px minmax(0, 1fr)' }, gap: { xs: 2, sm: 4, md: 6 }, mt: 4, alignItems: 'start' }}>
        <Stack component="nav" aria-label="Filter publications by year" sx={{ position: 'sticky', top: 100, alignItems: 'flex-start', gap: 0.75, pt: 2 }}>
          {[null, ...years].map((value) => (
            <ButtonBase
              key={value || 'all'}
              aria-pressed={year === value}
              onClick={() => setYear(value)}
              sx={{
                position: 'relative', py: 1, pl: 1.5, pr: 0.5, minHeight: 44,
                fontFamily: 'var(--font-display)', fontSize: { xs: value ? '1rem' : '0.7rem', sm: value ? '1.2rem' : '0.85rem' },
                fontWeight: year === value ? 500 : 400, whiteSpace: 'nowrap',
                color: year === value ? 'primary.main' : 'text.secondary',
                '&::before': { content: '""', position: 'absolute', left: 0, top: 9, bottom: 9, width: 2, bgcolor: 'primary.main', opacity: year === value ? 1 : 0, transition: 'opacity .2s ease', boxShadow: '0 0 8px color-mix(in srgb, var(--mui-palette-primary-main) 40%, transparent)' },
                '&:hover, &:focus-visible': { color: 'primary.main' },
                '&:hover::before, &:focus-visible::before': { opacity: 1 },
                '&:focus-visible': { outline: '1px solid', outlineColor: 'primary.main', outlineOffset: 3 },
              }}
            >{value || 'All years'}</ButtonBase>
          ))}
        </Stack>
        {filtered.length ? (
          <Box
            sx={{
              display: 'grid',
              '--tile-gap': 'calc(var(--mui-spacing) * 2.5)',
              gap: 'var(--tile-gap)',
              '& > :last-child': { '--tile-divider-below': 'hidden' },
              gridTemplateColumns: 'minmax(0, 1fr)',
            }}
          >
            {filtered.map((publication) => (
              <Box key={publication.id} data-publication-date={publication.date}><PublicationTile publication={publication} /></Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h5" component="p">
              No publications match that search.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Try an author name, a venue, or a broader topic.
            </Typography>
            <Button
              onClick={() => {
                setQuery('')
                setTag('')
                setYear(null)
              }}
              sx={{ mt: 2.5 }}
              color="inherit"
              variant="outlined"
            >
              Clear filters
            </Button>
          </Box>
        )}
      </Box>
    </>
  )
}
