'use client'

import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { animateCanvas } from '@/lib/canvasAnimation'
import { drawFlowParticle } from '@/lib/canvasEffects'
import { calibrationDifference, calibrationEnvelope, calibrationLimit, contactPositions, createBayesianDiagnostics, createContactNetwork, simulateInfection } from '@/lib/researchModels'

const smoothstep = (value) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

export default function ResearchFigure({ kind, sx }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!host || !context) return undefined
    let network = null
    let diagnostics = null
    let outbreak = -1
    let infections = []
    let width = 0
    let height = 0
    let colors = {}
    const readColors = () => {
      const styles = getComputedStyle(canvas)
      colors = {
        primary: styles.getPropertyValue('--mui-palette-primary-main').trim(),
        secondary: styles.getPropertyValue('--mui-palette-secondary-main').trim(),
        neutral: styles.getPropertyValue('--mui-palette-text-secondary').trim(),
        network: document.documentElement.classList.contains('dark') ? '#A6A6A6' : '#858585',
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
      if (kind === 'bayesian' && !diagnostics) diagnostics = createBayesianDiagnostics()
      if (kind === 'systems' && width > 0 && height > 0) {
        network = createContactNetwork(width / height)
        outbreak = -1
      }
    }
    const drawDiagnostics = (time, reduced) => {
      const cycle = (time % 20000) / 20000
      const count = reduced ? 96 : 4 + 124 * smoothstep(cycle / 0.85)
      const opacity = reduced ? 1 : 1 - smoothstep((cycle - 0.95) / 0.05)
      const gap = width < 400 ? 7 : 13
      const panelWidth = (width - 3 * gap) / 4
      const rowHeight = height / 2
      diagnostics.forEach((samples, parameter) => {
        const color = colors.primary
        const left = parameter * (panelWidth + gap) + 4
        const plotWidth = panelWidth - 8
        const plotHeight = rowHeight - 20
        const top = 8
        const bottom = rowHeight + 12
        const recovery = (x, y) => ({ x: left + (x + 3) / 6 * plotWidth, y: top + (3 - y) / 6 * plotHeight })
        const difference = calibrationDifference(samples, count)
        const limit = calibrationLimit(difference, count)
        const calibration = (x, y) => ({ x: left + x * plotWidth, y: bottom + (0.5 - y / (2 * limit)) * plotHeight })
        const stroke = (points, alpha, style = color, lineWidth = 0.8) => {
          context.beginPath()
          points.forEach((point, index) => { if (!index) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y) })
          context.strokeStyle = style; context.globalAlpha = alpha; context.lineWidth = lineWidth; context.stroke()
        }
        // Sparse axes preserve the eight-panel layout without labels or boxes.
        stroke([recovery(-3, 3), recovery(-3, -3), recovery(3, -3)], 0.28, colors.neutral)
        context.setLineDash([2, 3])
        stroke([recovery(-3, -3), recovery(3, 3)], 0.35, colors.neutral)
        context.setLineDash([])
        context.save()
        context.beginPath(); context.rect(left - 2, top - 2, plotWidth + 4, plotHeight + 4); context.clip()
        context.beginPath()
        samples.forEach((sample, index) => {
          if (index >= count) return
          const halfInterval = 1.645 * sample.deviation * smoothstep(count - index)
          const lower = recovery(sample.truth, sample.estimate - halfInterval)
          const upper = recovery(sample.truth, sample.estimate + halfInterval)
          context.moveTo(lower.x, lower.y); context.lineTo(upper.x, upper.y)
        })
        context.strokeStyle = color; context.globalAlpha = opacity * 0.18; context.lineWidth = 0.7; context.stroke()
        samples.forEach((sample, index) => {
          const visibility = opacity * smoothstep(count - index)
          if (!visibility) return
          const point = recovery(sample.truth, sample.estimate)
          const fresh = 1 - smoothstep((count - index - 1) / 5)
          drawFlowParticle(context, { ...point, radius: (width < 400 ? 0.7 : 1) + fresh * 0.5, color, visibility: visibility * (0.55 + fresh * 0.45) })
        })
        context.restore()
        // Pointwise 95% normal-approximation envelope, not a simultaneous band.
        // sqrt(p(1-p)/n) forms an ellipse tapering to zero at both endpoints.
        const center = calibration(0.5, 0)
        const radius = calibrationEnvelope(0.5, count) / (2 * limit) * plotHeight
        context.beginPath(); context.ellipse(center.x, center.y, plotWidth / 2, radius, 0, 0, Math.PI * 2)
        context.fillStyle = color; context.globalAlpha = opacity * 0.08; context.fill()
        context.setLineDash([2, 3])
        context.strokeStyle = color; context.globalAlpha = opacity * 0.3; context.lineWidth = 0.8; context.stroke()
        context.setLineDash([])
        stroke([calibration(0, 0), calibration(1, 0)], 0.32, colors.neutral)
        stroke([calibration(0, limit), calibration(0, -limit), calibration(1, -limit)], 0.28, colors.neutral)
        context.save()
        context.beginPath(); context.rect(left, bottom, plotWidth, plotHeight); context.clip()
        const curve = difference.map(({ x, y }) => calibration(x, y))
        context.shadowColor = color; context.shadowBlur = 3
        stroke(curve, opacity * 0.8, color, width < 400 ? 1 : 1.2)
        context.shadowBlur = 0
        context.restore()

      })
    }
    const drawSystems = (time, reduced) => {
      if (!network) return
      const iteration = Math.floor(time / 16000)
      if (iteration !== outbreak) {
        outbreak = iteration
        infections = simulateInfection(network, 19 + iteration * 137)
      }
      const cycle = (time % 16000) / 1000
      const seconds = cycle - 1.8
      const opacity = reduced ? 1 : 1 - smoothstep((cycle - 14.5) / 1.5)
      const points = contactPositions(network, time / 1000).map(({ x, y }) => ({ x: x * width, y: y * height }))
      const line = (a, b) => {
        context.beginPath()
        context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke()
      }
      const grayPoint = (point, radius = 1.9, visibility = 0.7) => {
        context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2)
        context.fillStyle = colors.network; context.globalAlpha = visibility; context.fill()
      }
      context.strokeStyle = colors.network; context.globalAlpha = 0.22; context.lineWidth = 0.8
      context.beginPath()
      network.edges.forEach(([a, b]) => { context.moveTo(points[a].x, points[a].y); context.lineTo(points[b].x, points[b].y) })
      context.stroke()
      network.connections.forEach(({ a, b, createdAt, availableAt }) => {
        const growth = smoothstep((seconds - createdAt) / (availableAt - createdAt))
        if (!growth) return
        const start = points[a], end = points[b]
        const tip = { x: start.x + (end.x - start.x) * growth, y: start.y + (end.y - start.y) * growth }
        const visibility = opacity
        context.strokeStyle = colors.network; context.globalAlpha = visibility * 0.32; context.lineWidth = 1
        line(start, tip)
        if (growth < 1) grayPoint(tip, 2, visibility * 0.7)
      })
      const pulses = []
      context.beginPath()
      infections.forEach((infection, index) => {
        if (infection.parent === null) return
        const a = points[infection.parent], b = points[index]
        const arrival = infection.time
        const departure = Math.max(infections[infection.parent].time, infection.availableAt, arrival - 0.75)
        if (seconds < departure) return
        const progress = Math.min(1, (seconds - departure) / (arrival - departure))
        const point = { x: a.x + (b.x - a.x) * progress, y: a.y + (b.y - a.y) * progress }
        context.moveTo(a.x, a.y); context.lineTo(point.x, point.y)
        if (progress < 1) pulses.push(point)
      })
      context.strokeStyle = colors.secondary; context.globalAlpha = opacity * 0.5; context.lineWidth = 0.8 + opacity * 1.2; context.stroke()
      pulses.forEach((point) => drawFlowParticle(context, { ...point, radius: 2, color: colors.secondary, visibility: opacity * 0.8 }))
      points.forEach((point, index) => {
        const infection = infections[index]
        const infected = seconds >= infection.time
        const onset = infected ? smoothstep((seconds - infection.time) / 0.25) * opacity : 0
        grayPoint(point, 1.9, 0.7 * (1 - onset))
        if (!infected) return
        const color = colors.secondary
        drawFlowParticle(context, { ...point, radius: 1.9 + onset * 1.3, color, visibility: onset })
        const age = seconds - infection.time
        if (age < 0.7) {
          context.beginPath(); context.arc(point.x, point.y, 3.6 + age * 7, 0, Math.PI * 2)
          context.strokeStyle = color; context.globalAlpha = opacity * (1 - age / 0.7) * 0.4
          context.lineWidth = 0.8; context.stroke()
        }
      })
    }
    const draw = (time, reduced) => {
      context.clearRect(0, 0, width, height)
      context.lineCap = 'round'
      if (kind === 'bayesian') drawDiagnostics(time, reduced)
      else drawSystems(time, reduced)
    }
    return animateCanvas({ element: host, render: draw, resize, readColors, offset: kind === 'bayesian' ? 3500 : 0, reducedTime: 9000 })

  }, [kind])

  return (
    <Box aria-hidden="true" data-research-figure={kind} sx={{ position: 'relative', width: '100%', ...sx }}>
      <Box component="canvas" ref={canvasRef} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </Box>
  )
}
