'use client'

import { IconButton, InputAdornment, TextField } from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'

export default function SearchField({ value, onChange, placeholder, label = 'Search', maxWidth = 620 }) {
  return (
    <TextField
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      slotProps={{
        // Must go on the <input> itself; on the TextField root it lands on a
        // plain wrapper div and names nothing.
        htmlInput: { 'aria-label': label },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded fontSize="small" sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton size="small" aria-label="Clear search" onClick={() => onChange('')}>
                <CloseRounded fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      sx={{
        display: 'flex',
        maxWidth,
        '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 1 },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
      }}
    />
  )
}
