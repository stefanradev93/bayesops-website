'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Box } from '@mui/material'

const transitionDuration = 180

/** Keeps the site chrome steady while routed page content fades out and in. */
export default function PageTransition({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const pathRef = useRef(pathname)
  const incomingRef = useRef(children)
  const leavingRef = useRef(false)
  const navigationTimerRef = useRef()
  const [content, setContent] = useState(children)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    incomingRef.current = children
  }, [children])

  // Start the outgoing fade before Next commits an internal link navigation.
  // Capture phase lets this run before the Link component's own click handler.
  useEffect(() => {
    const handleClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const anchor = event.target.closest('a[href]')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin) return
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) {
        return
      }

      event.preventDefault()
      const href = `${destination.pathname}${destination.search}${destination.hash}`
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        router.push(href)
        return
      }

      window.clearTimeout(navigationTimerRef.current)
      leavingRef.current = true
      setVisible(false)
      navigationTimerRef.current = window.setTimeout(() => {
        router.push(href)
      }, transitionDuration)
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      window.clearTimeout(navigationTimerRef.current)
    }
  }, [router])

  useEffect(() => {
    if (pathname === pathRef.current) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || leavingRef.current) {
      const frame = requestAnimationFrame(() => {
        pathRef.current = pathname
        leavingRef.current = false
        setContent(incomingRef.current)
        requestAnimationFrame(() => setVisible(true))
      })
      return () => cancelAnimationFrame(frame)
    }

    // Browser back/forward cannot be delayed, so retain a graceful fallback.
    const fadeFrame = requestAnimationFrame(() => setVisible(false))
    const swapTimer = window.setTimeout(() => {
      pathRef.current = pathname
      setContent(incomingRef.current)
      requestAnimationFrame(() => setVisible(true))
    }, transitionDuration)

    return () => {
      cancelAnimationFrame(fadeFrame)
      window.clearTimeout(swapTimer)
    }
  }, [pathname])

  return (
    <Box
      sx={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: `opacity ${transitionDuration}ms ease`,
        willChange: 'opacity',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      {content}
    </Box>
  )
}
