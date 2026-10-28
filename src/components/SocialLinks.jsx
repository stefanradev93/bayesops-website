'use client'

import { IconButton, Stack, Tooltip } from '@mui/material'
import { socialIcon } from './SocialIcons'
import { site, social } from '@/lib/site'

export default function SocialLinks() {
  return (
    <Stack direction="row" spacing={0.5} sx={{ ml: -1 }}>
      {social.map((item) => {
        const Icon = socialIcon(item.type)
        return (
          <Tooltip key={item.type} title={item.label}>
            <IconButton
              component="a"
              href={item.href}
              target={item.type === 'email' ? undefined : '_blank'}
              rel="noreferrer"
              aria-label={`${site.title} on ${item.label}`}
              size="small"
              sx={{ color: 'text.secondary', '&:hover, &:focus-visible': { color: 'primary.main' } }}
            >
              <Icon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      })}
    </Stack>
  )
}
