'use client'

import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { flowPatterns, flowPoint } from '@/lib/flowPatterns'
import { animateCanvas } from '@/lib/canvasAnimation'
import { drawFlowParticle, drawFlowTrail, sampleParticleTrail } from '@/lib/canvasEffects'

/** Each variant has its own geometry and motion, with shared visual styling. */
export default function FlowBackground({ variant, sx }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const context = canvas?.getContext('2d')
    const pattern = flowPatterns[variant]
    if (!host || !context || !pattern) return undefined
    let width = 0
    let height = 0
    let colors = {}
    const pointAt = (progress, lane, time) => {
      const point = flowPoint(pattern.geometry, progress, lane, time)
      return { x: point.x * width, y: point.y * height }
    }
    const readColors = () => {
      const styles = getComputedStyle(canvas)
      colors = {
        primary: styles.getPropertyValue('--mui-palette-primary-main').trim(),
        secondary: styles.getPropertyValue('--mui-palette-secondary-main').trim(),
      }
    }
    const resize = () => {
      const bounds = host.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const trace = (point) => context.lineTo(point.x, point.y)
    const draw = (milliseconds, reduced) => {
      const time = milliseconds / 1000
      context.clearRect(0, 0, width, height)
      context.lineCap = 'round'
      context.lineJoin = 'round'

      for (let line = 0; line < pattern.lines; line += 1) {
        // Keep lane coordinates strictly inside the pattern's parameter range.
        const lane = -0.98 + 1.96 * line / (pattern.lines - 1)
        context.beginPath()
        const first = pointAt(0, lane, time)
        context.moveTo(first.x, first.y)
        for (let step = 1; step <= 64; step += 1) trace(pointAt(step / 64, lane, time))
        context.strokeStyle = line % 3 === 0 ? colors.secondary : colors.primary
        if (pattern.geometry === 'ribbons') {
          context.globalAlpha = 0.035
          context.lineWidth = 11 + line % 3 * 4
          context.stroke()
        }
        context.globalAlpha = 0.14 + 0.025 * Math.sin(time * 0.45 + line)
        context.lineWidth = 0.95
        context.stroke()
      }
      if (pattern.geometry === 'grid') {
        for (let line = 0; line <= 20; line += 1) {
          context.beginPath()
          for (let step = 0; step <= 48; step += 1) {
            const point = pointAt(line / 20, step / 24 - 1, time)
            if (!step) context.moveTo(point.x, point.y)
            else trace(point)
          }
          context.globalAlpha = 0.1
          context.lineWidth = 0.75
          context.strokeStyle = colors.primary
          context.stroke()
        }
      }

      for (let index = 0; index < pattern.particles; index += 1) {
        const seed = (index * 0.61803398875) % 1
        const progress = (seed + time * 0.045) % 1
        let lane = -0.96 + 1.92 * ((index * 0.754877666) % 1)
        let along = progress
        if (pattern.geometry === 'radial') {
          lane = -0.98 + 1.96 * progress
          along = seed
        }
        const point = pointAt(along, lane, time)
        const visibility = Math.sin(Math.PI * progress) ** 0.45
        const color = index % 3 === 0 ? colors.secondary : colors.primary
        const radius = 1.4 + index % 3 * 0.35
        const points = reduced ? [point] : sampleParticleTrail((pastTime) => {
          const pastProgress = Math.max(0, progress - (time - pastTime) * 0.045)
          return pattern.geometry === 'radial'
            ? pointAt(seed, -0.98 + 1.96 * pastProgress, pastTime)
            : pointAt(pastProgress, lane, pastTime)
        }, time, { duration: 0.2, maxLength: width < 600 ? 16 : 24, earliestTime: time - progress / 0.045 })
        drawFlowTrail(context, { points, color, lineWidth: 0.45 + radius * 0.7, visibility })
        drawFlowParticle(context, { ...point, radius, color, visibility })
      }
    }
    return animateCanvas({ element: host, render: draw, resize, readColors, offset: 3000 })

  }, [variant])

  return (
    <Box aria-hidden="true" data-flow-animation={variant} sx={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none', ...sx }}>
      <Box component="canvas" ref={canvasRef} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </Box>
  )
}
