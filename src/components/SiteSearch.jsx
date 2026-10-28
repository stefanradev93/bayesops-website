'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Box, Stack, Typography } from '@mui/material'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import SearchField from './SearchField'

const MAX_RESULTS = 8

/** Site-wide search, used by the 404 page to recover a mistyped URL. */
export default function SiteSearch({ index }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []
    return index
      .map((item) => {
        const title = item.title.toLowerCase()
        if (title.includes(needle)) return { item, rank: title.startsWith(needle) ? 0 : 1 }
        if (item.text?.toLowerCase().includes(needle)) return { item, rank: 2 }
        return null
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, MAX_RESULTS)
      .map(({ item }) => item)
  }, [index, query])

  return (
    <>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search the site…"
        label="Search the BayesOps website"
        maxWidth="none"
      />

      {query.trim().length >= 2 && (
        <Stack sx={{ mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
          {results.length ? (
            results.map((result, index_) => (
              <Box
                key={`${result.href}-${index_}`}
                component={Link}
                href={result.href}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  px: 2.5,
                  py: 2,
                  bgcolor: 'background.paper',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderTop: index_ ? '1px solid' : 0,
                  borderColor: 'divider',
                  transition: 'background-color .18s ease',
                  '&:hover, &:focus-visible': { bgcolor: 'surface.raised' },
                  '&:hover svg': { transform: 'translateX(3px)' },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  {result.kind && (
                    <Typography variant="overline" color="text.secondary" component="p" sx={{ lineHeight: 1.4 }}>
                      {result.kind}
                    </Typography>
                  )}
                  <Typography sx={{ fontWeight: 500 }} noWrap>
                    {result.title}
                  </Typography>
                </Box>
                <ArrowForwardRounded
                  fontSize="small"
                  sx={{ color: 'text.secondary', transition: 'transform .2s ease', flexShrink: 0 }}
                />
              </Box>
            ))
          ) : (
            <Typography color="text.secondary" sx={{ px: 2.5, py: 3, bgcolor: 'background.paper' }}>
              Nothing matched “{query}”.
            </Typography>
          )}
        </Stack>
      )}
    </>
  )
}
