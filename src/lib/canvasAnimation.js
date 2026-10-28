// One clock and lifecycle for every animated canvas or chart. Hidden and
// offscreen elements do no drawing or model work, and do not advance their clocks.
// Pass a `controls` object to receive refresh, time, seek, and setPaused for
// interactive charts that pause or scrub without rebuilding.
export function animateCanvas({ element, render, resize, readColors = () => {}, offset = 0, reducedTime = 7000, fps = 30, paused = false, controls }) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let frame
  let visible = false
  let elapsed = offset
  let previous = null
  let lastPaint = -Infinity
  let sizeDirty = true
  let colorDirty = true
  let sizeKey = ''
  // A user-chosen time replaces the reduced-motion still frame.
  let sought = false
  const active = () => visible && !document.hidden && !paused
  const paint = () => {
    if (sizeDirty) {
      const bounds = element.getBoundingClientRect()
      sizeKey = `${bounds.width},${bounds.height},${window.devicePixelRatio}`
      resize(); sizeDirty = false
    }
    if (colorDirty) { readColors(); colorDirty = false }
    render(motion.matches && !sought ? reducedTime : elapsed, motion.matches)
  }
  const tick = (timestamp) => {
    frame = undefined
    if (!active() || motion.matches) return
    if (previous !== null) elapsed += Math.max(0, timestamp - previous)
    previous = timestamp
    if (timestamp - lastPaint >= 1000 / fps - 0.5) { paint(); lastPaint = timestamp }
    frame = requestAnimationFrame(tick)
  }
  const refresh = () => {
    cancelAnimationFrame(frame)
    frame = undefined
    previous = null
    if (!visible || document.hidden) return
    paint()
    lastPaint = performance.now()
    if (!motion.matches && !paused) { previous = lastPaint; frame = requestAnimationFrame(tick) }
  }
  const resizeObserver = new ResizeObserver(() => {
    const bounds = element.getBoundingClientRect()
    const key = `${bounds.width},${bounds.height},${window.devicePixelRatio}`
    if (key === sizeKey) return
    sizeKey = key
    sizeDirty = true
    refresh()
  })
  const themeObserver = new MutationObserver(() => { colorDirty = true; refresh() })
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    if (visible === entry.isIntersecting) return
    visible = entry.isIntersecting
    refresh()
  })
  if (controls) Object.assign(controls, {
    refresh,
    time: () => elapsed,
    seek: (time) => { elapsed = time; sought = true; refresh() },
    setPaused: (value) => { paused = value; refresh() },
  })
  resizeObserver.observe(element)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  visibilityObserver.observe(element)
  document.addEventListener('visibilitychange', refresh)
  motion.addEventListener('change', refresh)
  return () => {
    cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    themeObserver.disconnect()
    visibilityObserver.disconnect()
    document.removeEventListener('visibilitychange', refresh)
    motion.removeEventListener('change', refresh)
  }
}
