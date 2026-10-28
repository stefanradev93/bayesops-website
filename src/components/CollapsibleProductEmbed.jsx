'use client'

import { useId, useState } from 'react'
import { Box, Button, Container, Stack } from '@mui/material'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import ArrowOutwardRounded from '@mui/icons-material/ArrowOutwardRounded'
import ProductEmbed from './ProductEmbed'
import { LinkButton } from './links'

export default function CollapsibleProductEmbed({ href, title }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <Box>
      <Container sx={{ mb: open ? 3 : 0 }}>
        <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant={open ? 'outlined' : 'contained'} startIcon={open ? undefined : <PlayArrowRounded />} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} sx={{ px: 3, py: 1.5 }}>
            {open ? 'Hide demo' : 'Try the demo'}
          </Button>
          <LinkButton href={href} endIcon={<ArrowOutwardRounded />}>Open in new tab</LinkButton>
        </Stack>
      </Container>
      <Box id={id} hidden={!open}>
        {open && <ProductEmbed href={href} title={title} />}
      </Box>
    </Box>
  )
}
