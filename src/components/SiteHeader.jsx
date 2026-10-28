'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AppBar,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  useScrollTrigger,
} from '@mui/material'
import MenuRounded from '@mui/icons-material/MenuRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import BrandLogo from './BrandLogo'
import ThemeToggle from './ThemeToggle'
import { nav, site } from '@/lib/site'

const isActive = (pathname, href) => pathname === href || pathname.startsWith(`${href}/`)

const blockButtonSx = {
  minWidth: 0,
  alignSelf: 'stretch',
  px: { sm: 2.5, lg: 3 },
  py: 1,
  borderRadius: 0,
  fontSize: '.9375rem',
  bgcolor: 'transparent',
  color: 'text.primary',
  boxShadow: 'none',
  '&:hover, &:focus-visible': { bgcolor: 'var(--header-button-bg)', color: 'var(--header-button-text)', boxShadow: 'none' },
  '&[aria-current="page"]': { boxShadow: 'inset 0 -3px 0 currentColor' },
  '&:focus-visible': { outline: '2px solid currentColor', outlineOffset: '-6px', boxShadow: 'none' },
}

const navButtonSx = {
  ...blockButtonSx,
  '--header-button-bg': '#4F46E5',
  '--header-button-text': '#FFFFFF',
  '.dark &': { '--header-button-bg': '#A5B4FC', '--header-button-text': '#17171F' },
}

const contactButtonSx = {
  ...blockButtonSx,
  '--header-button-bg': 'var(--mui-palette-secondary-main)',
  '--header-button-text': 'var(--mui-palette-secondary-contrastText)',
}

function Wordmark({ onClick }) {
  return (
    <Stack
      component={Link}
      direction="row"
      spacing={1.25}
      href="/"
      onClick={onClick}
      aria-label={`${site.title} home`}
      sx={{ alignItems: 'center', textDecoration: 'none', color: 'text.primary', flexShrink: 0 }}
    >
      <BrandLogo sx={{ width: { xs: 132, sm: 145 }, height: 'auto' }} />
    </Stack>
  )
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // Sit flush over the hero at the top of the page, then settle onto a surface.
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 })

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: '1px solid',
          borderColor: scrolled ? 'divider' : 'transparent',
          bgcolor: 'color-mix(in srgb, var(--mui-palette-background-default) 90%, transparent)',
          backdropFilter: 'blur(12px)',
          transition: 'background-color .25s ease, border-color .25s ease',
        }}
      >
        <Container>
          <Toolbar disableGutters sx={{ height: { xs: 64, md: 72 }, minHeight: { xs: 64, md: 72 }, gap: { xs: 1, sm: 2, md: .5 } }}>
            <Wordmark />

            <Stack
              component="nav"
              aria-label="Main"
              direction="row"
              spacing={0.5}
              sx={{ ml: 'auto', alignSelf: 'stretch', display: { xs: 'none', md: 'flex' } }}
            >
              {nav.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <Tooltip key={item.href} title={item.tooltip} enterDelay={600}>
                    <Button
                      component={Link}
                      href={item.href}
                      variant="text"
                      color="primary"
                      aria-current={active ? 'page' : undefined}
                      sx={navButtonSx}
                    >
                      {item.label}
                    </Button>
                  </Tooltip>
                )
              })}
            </Stack>

            <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5, md: 1 }} sx={{ alignItems: 'center', alignSelf: 'stretch', ml: { xs: 'auto', md: 0 } }}>
              <Button
                component={Link}
                href="/contact"
                variant="text"
                color="secondary"
                aria-current={isActive(pathname, '/contact') ? 'page' : undefined}
                sx={{
                  ...contactButtonSx,
                  display: { xs: 'none', sm: 'inline-flex' },
                  flexShrink: 0,
                }}
              >
                Get in touch
              </Button>
              <ThemeToggle />
              <IconButton
                onClick={() => setOpen(true)}
                aria-label="Open navigation menu"
                sx={{ display: { md: 'none' } }}
              >
                <MenuRounded />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 'min(88vw, 360px)', bgcolor: 'background.default' } } }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5, height: 64 }}>
          <Wordmark onClick={() => setOpen(false)} />
          <IconButton onClick={() => setOpen(false)} aria-label="Close navigation menu">
            <CloseRounded />
          </IconButton>
        </Stack>
        <Divider />
        <Stack component="nav" aria-label="Main" sx={{ p: 1.5, gap: 1 }}>
          {[{ label: 'Home', href: '/' }, ...nav].map((item) => (
            <Button
              key={item.href}
              component={Link}
              href={item.href}
              variant="text"
              color="primary"
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              onClick={() => setOpen(false)}
              sx={{
                ...navButtonSx,
                px: 1.5,
                py: 1.75,
                justifyContent: 'flex-start',
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
        <Button
          component={Link}
          href="/contact"
          variant="text"
          color="secondary"
          onClick={() => setOpen(false)}
          aria-current={isActive(pathname, '/contact') ? 'page' : undefined}
          endIcon={<ArrowForwardRounded />}
          sx={{
            ...contactButtonSx,
            m: 2.5,
          }}
        >
          Get in touch
        </Button>
      </Drawer>
    </>
  )
}
