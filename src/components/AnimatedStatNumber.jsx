'use client'

import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'

// Keep completed animations across client navigation, but reset on refresh.
const completed = new Set()
const DURATION = 2400
const rows = Array.from({ length: 30 }, (_, index) => index % 10)

export default function AnimatedStatNumber({ value, animationKey }) {
  const hostRef = useRef(null)
  const text = String(value)

  useEffect(() => {
    const host = hostRef.current
    const reels = [...host.querySelectorAll('[data-digit]')]
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame
    let observer
    let elapsed = 0
    let previous = null
    let visible = false
    let finished = completed.has(animationKey)
    const paint = (progress) => {
      reels.forEach((reel, index) => {
        // A small stagger lets the digits settle from left to right.
        const delay = reels.length > 1 ? index / (reels.length - 1) * 180 : 0
        const t = Math.max(0, Math.min(1, (progress * DURATION - delay) / (DURATION - delay)))
        // Fast initial roll with a long, gradual slowdown into the final digit.
        const eased = 1 - (1 - t) ** 3
        reel.style.transform = `translateY(-${(20 + Number(reel.dataset.digit)) * eased * 1.05}em)`
      })
    }
    const finish = () => {
      finished = true
      completed.add(animationKey)
      cancelAnimationFrame(frame)
      observer?.disconnect()
      paint(1)
    }
    const tick = (now) => {
      if (previous !== null) elapsed += now - previous
      previous = now
      paint(Math.min(elapsed / DURATION, 1))
      if (elapsed >= DURATION) finish()
      else frame = requestAnimationFrame(tick)
    }
    const update = () => {
      cancelAnimationFrame(frame)
      previous = null
      if (!finished && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }
    if (finished || motion.matches) {
      finish()
      return
    }
    observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    }, { threshold: 0.5 })
    paint(0)
    observer.observe(host)
    const onMotionChange = () => { if (motion.matches) finish() }
    document.addEventListener('visibilitychange', update)
    motion.addEventListener('change', onMotionChange)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
      motion.removeEventListener('change', onMotionChange)
    }
  }, [animationKey, text])

  return (
    <Box component="span" ref={hostRef} role="img" aria-label={text} sx={{ display: 'inline-flex', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05, verticalAlign: 'bottom' }}>
      {[...text].map((character, index) => /\d/.test(character) ? (
        <Box component="span" key={index} aria-hidden="true" sx={{ display: 'inline-block', height: '1.05em', width: '1ch', overflow: 'hidden' }}>
          <Box component="span" data-digit={character} sx={{ display: 'block', transform: `translateY(-${(20 + Number(character)) * 1.05}em)` }}>
            {rows.map((digit, row) => <Box component="span" key={row} sx={{ display: 'block', height: '1.05em', textAlign: 'center' }}>{digit}</Box>)}
          </Box>
        </Box>
      ) : <Box component="span" key={index} aria-hidden="true">{character}</Box>)}
    </Box>
  )
}
