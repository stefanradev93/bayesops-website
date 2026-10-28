'use client'

import { IconButton, Tooltip } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'

export default function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme()
  // `mode` is undefined until the provider mounts; render a stable placeholder
  // so the button does not shift the toolbar on hydration.
  if (!mode) return <IconButton disabled aria-hidden sx={{ opacity: 0 }}><DarkModeOutlined /></IconButton>

  const resolved = mode === 'system' ? systemMode : mode
  const next = resolved === 'dark' ? 'light' : 'dark'

  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`} size="small">
        {resolved === 'dark' ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
}
