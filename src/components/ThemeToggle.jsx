'use client'

import { flushSync } from 'react-dom'
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
  // Cross-fade the whole page between schemes where View Transitions are
  // supported; elsewhere, and with reduced motion, the switch stays instant.
  const switchMode = () => {
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMode(next)
      return
    }
    document.startViewTransition(() => new Promise((resolve) => {
      const root = document.documentElement
      // MUI applies the class in an effect; capture the new state once it lands.
      const observer = new MutationObserver(() => { if (root.classList.contains(next)) done() })
      const timeout = window.setTimeout(() => done(), 300)
      function done() { observer.disconnect(); window.clearTimeout(timeout); resolve() }
      observer.observe(root, { attributes: true, attributeFilter: ['class'] })
      flushSync(() => setMode(next))
      if (root.classList.contains(next)) done()
    }))
  }

  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton onClick={switchMode} aria-label={`Switch to ${next} mode`} size="small">
        {resolved === 'dark' ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
}
