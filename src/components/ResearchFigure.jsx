'use client'

import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { animateCanvas } from '@/lib/canvasAnimation'
import { drawFlowParticle } from '@/lib/canvasEffects'
import { contactPositions, createBayesianDiagnostics, createContactNetwork, createRandomField, createTimeVaryingPosteriors, sampleRandomField, simulateInfection } from '@/lib/researchModels'

// Each field panel doubles the grid resolution of the one before it.
const fieldSizes = [4, 8, 16, 32, 64, 128]
const hexRgb = (hex) => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))

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
    let posteriors = null
    let field = null
    let fields = []
    let fieldColors = {}
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
      fieldColors = { positive: hexRgb(colors.secondary), negative: hexRgb(colors.primary) }
    }
    const resize = () => {
      const bounds = host.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      if (kind === 'bayesian' && !diagnostics) {
        diagnostics = createBayesianDiagnostics()
        posteriors = createTimeVaryingPosteriors()
        field = createRandomField()
        fields = fieldSizes.map((size) => {
          const buffer = document.createElement('canvas')
          buffer.width = buffer.height = size
          return { size, buffer, image: buffer.getContext('2d').createImageData(size, size), values: new Float32Array(size * size) }
        })
      }
      if (kind === 'systems' && width > 0 && height > 0) {
        network = createContactNetwork(width / height)
        outbreak = -1
      }
    }
    // Three rows of six: parameter recovery, time-varying posteriors, and one
    // evolving Gaussian random field sampled at doubling resolutions.
    const drawDiagnostics = (time, reduced) => {
      const cycle = (time % 20000) / 20000
      const progress = reduced ? 1 : smoothstep(cycle / 0.85)
      const count = 4 + 124 * progress
      const opacity = reduced ? 1 : 1 - smoothstep((cycle - 0.95) / 0.05)
      const gap = width < 400 ? 6 : 12
      const rowGap = width < 400 ? 10 : 16
      const panelWidth = (width - 5 * gap) / 6
      const panelHeight = (height - 2 * rowGap) / 3
      const color = colors.primary
      const stroke = (points, alpha, style = color, lineWidth = 0.8) => {
        context.beginPath()
        points.forEach((point, index) => { if (!index) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y) })
        context.strokeStyle = style; context.globalAlpha = alpha; context.lineWidth = lineWidth; context.stroke()
      }
      // Sparse axes keep the grid readable without labels or boxes.
      const axes = (left, top, plotWidth, plotHeight) => stroke([{ x: left, y: top }, { x: left, y: top + plotHeight }, { x: left + plotWidth, y: top + plotHeight }], 0.28, colors.neutral)

      diagnostics.forEach((samples, parameter) => {
        const left = parameter * (panelWidth + gap) + 4
        const plotWidth = panelWidth - 8
        const plotHeight = panelHeight - 8
        const top = 4
        const recovery = (x, y) => ({ x: left + (x + 3) / 6 * plotWidth, y: top + (3 - y) / 6 * plotHeight })
        axes(left, top, plotWidth, plotHeight)
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
          drawFlowParticle(context, { ...point, radius: (width < 400 ? 0.6 : 0.9) + fresh * 0.5, color, visibility: visibility * (0.55 + fresh * 0.45) })
        })
        context.restore()
      })

      // Posterior medians and 95% intervals sweep across the trials; the dashed line is the simulated truth.
      posteriors.forEach(({ truth, median, deviation }, parameter) => {
        const left = parameter * (panelWidth + gap) + 4
        const plotWidth = panelWidth - 8
        const plotHeight = panelHeight - 8
        const top = panelHeight + rowGap + 4
        const lower = median.map((value, index) => value - 1.96 * deviation[index])
        const upper = median.map((value, index) => value + 1.96 * deviation[index])
        const minimum = Math.min(...lower, ...truth), maximum = Math.max(...upper, ...truth)
        const point = (index, value) => ({ x: left + index / (median.length - 1) * plotWidth, y: top + (maximum - value) / (maximum - minimum) * plotHeight })
        const tip = progress * (median.length - 1)
        const shown = (values) => {
          const whole = Math.floor(tip)
          const points = values.slice(0, whole + 1).map((value, index) => point(index, value))
          if (whole < values.length - 1) points.push(point(tip, values[whole] + (values[whole + 1] - values[whole]) * (tip - whole)))
          return points
        }
        axes(left, top, plotWidth, plotHeight)
        context.setLineDash([2, 2.5])
        stroke(truth.map((value, index) => point(index, value)), 0.55, colors.secondary, width < 400 ? 0.7 : 0.9)
        context.setLineDash([])
        const upperPoints = shown(upper), lowerPoints = shown(lower)
        context.beginPath()
        upperPoints.forEach(({ x, y }, index) => { if (!index) context.moveTo(x, y); else context.lineTo(x, y) })
        lowerPoints.toReversed().forEach(({ x, y }) => context.lineTo(x, y))
        context.closePath()
        context.fillStyle = color; context.globalAlpha = opacity * 0.16; context.fill()
        const medianPoints = shown(median)
        stroke(medianPoints, opacity * 0.9, color, width < 400 ? 0.9 : 1.2)
        if (progress < 1) {
          stroke([upperPoints.at(-1), lowerPoints.at(-1)], opacity * 0.5, color, width < 400 ? 1.2 : 1.8)
          drawFlowParticle(context, { ...medianPoints.at(-1), radius: width < 400 ? 1.3 : 1.8, color, visibility: opacity })
        }
      })

      // Raspberry above zero, violet below; stronger values are more opaque.
      const side = Math.min(panelWidth, panelHeight)
      const top = 2 * (panelHeight + rowGap) + (panelHeight - side) / 2
      fields.forEach(({ size, buffer, image, values }, index) => {
        sampleRandomField(field, size, time / 1000, values)
        values.forEach((value, cell) => {
          const [red, green, blue] = value > 0 ? fieldColors.positive : fieldColors.negative
          const pixel = cell * 4
          image.data[pixel] = red; image.data[pixel + 1] = green; image.data[pixel + 2] = blue
          image.data[pixel + 3] = 230 * Math.min(1, Math.abs(value) / 2)
        })
        buffer.getContext('2d').putImageData(image, 0, 0)
        // Crisp cells show each resolution; the particle sprites still need smoothing.
        context.save()
        context.imageSmoothingEnabled = false
        context.globalAlpha = 1
        context.drawImage(buffer, index * (panelWidth + gap) + (panelWidth - side) / 2, top, side, side)
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
