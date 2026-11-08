'use client'

import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { animateCanvas } from '@/lib/canvasAnimation'
import { drawFlowParticle } from '@/lib/canvasEffects'
import { contactPositions, createBayesianDiagnostics, createContactNetwork, createPowerLawFields, samplePowerLawField, simulateInfection } from '@/lib/researchModels'

// Power-law GRFs at 128×128 with alpha rising across the row, as in
// Fig. 13C of Arruda et al. (2025).
const fieldSize = 128
const fieldAlphas = [1.8, 2.6, 3.4, 4.2, 5]
const readoutSamples = 64
const incidenceBins = 16
const hexRgb = (hex) => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
// Blends a little of `tint` into `base`, so each figure's panels lean toward its own accent.
const mixHex = (base, tint, amount, alpha = 1) => {
  const [from, to] = [hexRgb(base), hexRgb(tint)]
  return `rgb(${from.map((value, index) => Math.round(value + (to[index] - value) * amount)).join(' ')} / ${alpha})`
}
const panelTint = 0.07
// Panels sit lightly on the page rather than as solid blocks.
const panelOpacity = 0.2

const smoothstep = (value) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

export default function ResearchFigure({ kind, posteriors = [], sx }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!host || !context) return undefined
    let network = null
    let diagnostics = null
    let fields = []
    let fieldColors = {}
    let outbreak = -1
    let infections = []
    let summary = null
    let width = 0
    let height = 0
    let colors = {}
    const readColors = () => {
      const styles = getComputedStyle(canvas)
      colors = {
        primary: styles.getPropertyValue('--mui-palette-primary-main').trim(),
        secondary: styles.getPropertyValue('--mui-palette-secondary-main').trim(),
        neutral: styles.getPropertyValue('--mui-palette-text-secondary').trim(),
        panel: styles.getPropertyValue('--mui-palette-surface-raised').trim(),
        network: document.documentElement.classList.contains('dark') ? '#A6A6A6' : '#858585',
      }
      colors.panel = mixHex(colors.panel, kind === 'bayesian' ? colors.primary : colors.secondary, panelTint, panelOpacity)
      // Each figure pairs its own accent with the shared neutral: violet on the left, rose on the right.
      fieldColors = { positive: hexRgb(colors.primary), negative: hexRgb(colors.network) }
    }
    // Both figures share one 5 × 3 grid of accent-tinted panels in place of label-less axes.
    const grid = () => {
      const small = width < 400
      const gap = small ? 6 : 12, rowGap = gap
      return { small, gap, rowGap, inset: small ? 5 : 9, panelWidth: (width - 4 * gap) / 5, panelHeight: (height - 2 * rowGap) / 3 }
    }
    const panel = (column, row, columns = 1, rows = 1) => {
      const { gap, rowGap, inset, panelWidth, panelHeight } = grid()
      const x = column * (panelWidth + gap), y = row * (panelHeight + rowGap)
      const panelSpan = columns * panelWidth + (columns - 1) * gap, panelRise = rows * panelHeight + (rows - 1) * rowGap
      context.globalAlpha = 1; context.fillStyle = colors.panel
      context.beginPath(); context.roundRect(x, y, panelSpan, panelRise, 3); context.fill()
      return { left: x + inset, top: y + inset, plotWidth: panelSpan - 2 * inset, plotHeight: panelRise - 2 * inset }
    }
    const stroke = (points, alpha, style, lineWidth = 0.8) => {
      context.beginPath()
      points.forEach((point, index) => { if (!index) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y) })
      context.strokeStyle = style; context.globalAlpha = alpha; context.lineWidth = lineWidth; context.stroke()
    }
    const area = (upperPoints, lowerPoints, alpha, style) => {
      context.beginPath()
      upperPoints.forEach(({ x, y }, index) => { if (!index) context.moveTo(x, y); else context.lineTo(x, y) })
      lowerPoints.toReversed().forEach(({ x, y }) => context.lineTo(x, y))
      context.closePath(); context.fillStyle = style; context.globalAlpha = alpha; context.fill()
    }
    // Values sampled evenly over [0, 1], drawn up to a fractional tip.
    const sweep = (values, tip, point) => {
      const position = tip * (values.length - 1)
      const whole = Math.floor(position)
      const shown = values.slice(0, whole + 1).map((value, index) => point(index / (values.length - 1), value))
      if (whole < values.length - 1) shown.push(point(tip, values[whole] + (values[whole + 1] - values[whole]) * (position - whole)))
      return shown
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
        // Keep the last five of the six simulated columns so the panels match the earlier six-column grid.
        diagnostics = createBayesianDiagnostics().slice(1)
        fields = createPowerLawFields({ size: fieldSize, alphas: fieldAlphas }).map((field) => {
          const buffer = document.createElement('canvas')
          buffer.width = buffer.height = fieldSize
          return { field, buffer, image: buffer.getContext('2d').createImageData(fieldSize, fieldSize), values: new Float32Array(fieldSize * fieldSize) }
        })
      }
      if (kind === 'systems' && width > 0 && height > 0) {
        const { inset, panelHeight, rowGap } = grid()
        network = createContactNetwork((width - 2 * inset) / (2 * panelHeight + rowGap - 2 * inset))
        outbreak = -1
      }
    }
    // Three rows of five: parameter recovery, time-varying posteriors, and one
    // Gaussian random fields whose power-law exponent alpha grows across the row.
    const drawDiagnostics = (time, reduced) => {
      const cycle = (time % 20000) / 20000
      const progress = reduced ? 1 : smoothstep(cycle / 0.85)
      const count = 4 + 124 * progress
      const opacity = reduced ? 1 : 1 - smoothstep((cycle - 0.95) / 0.05)
      const { gap, rowGap, panelWidth, panelHeight } = grid()
      const color = colors.primary

      diagnostics.forEach((samples, parameter) => {
        const { left, top, plotWidth, plotHeight } = panel(parameter, 0)
        const recovery = (x, y) => ({ x: left + (x + 3) / 6 * plotWidth, y: top + (3 - y) / 6 * plotHeight })
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

      // Recorded Superstats posterior medians and pointwise 95% intervals sweep across
      // the trials; the dashed line is the simulated truth.
      posteriors.forEach(({ truth, median, lower, upper }, parameter) => {
        const { left, top, plotWidth, plotHeight } = panel(parameter, 1)
        const minimum = Math.min(...lower, ...truth), maximum = Math.max(...upper, ...truth)
        const point = (index, value) => ({ x: left + index / (median.length - 1) * plotWidth, y: top + (maximum - value) / (maximum - minimum) * plotHeight })
        const tip = progress * (median.length - 1)
        const shown = (values) => {
          const whole = Math.floor(tip)
          const points = values.slice(0, whole + 1).map((value, index) => point(index, value))
          if (whole < values.length - 1) points.push(point(tip, values[whole] + (values[whole + 1] - values[whole]) * (tip - whole)))
          return points
        }
        context.setLineDash([2, 2.5])
        stroke(truth.map((value, index) => point(index, value)), 0.75, colors.network, width < 400 ? 0.7 : 0.9)
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

      // Violet above zero, neutral gray below; stronger values are more opaque.
      const side = Math.min(panelWidth, panelHeight)
      const top = 2 * (panelHeight + rowGap) + (panelHeight - side) / 2
      fields.forEach(({ field, buffer, image, values }, index) => {
        samplePowerLawField(field, time / 1000, values)
        values.forEach((value, cell) => {
          const [red, green, blue] = value > 0 ? fieldColors.positive : fieldColors.negative
          const pixel = cell * 4
          image.data[pixel] = red; image.data[pixel + 1] = green; image.data[pixel + 2] = blue
          image.data[pixel + 3] = 230 * Math.min(1, Math.abs(value) / 2)
        })
        buffer.getContext('2d').putImageData(image, 0, 0)
        // Rounded like the plot panels above.
        const fieldLeft = index * (panelWidth + gap) + (panelWidth - side) / 2
        context.save()
        context.beginPath(); context.roundRect(fieldLeft, top, side, side, 3); context.clip()
        context.globalAlpha = 1
        context.drawImage(buffer, fieldLeft, top, side, side)
        context.restore()
      })
    }
    // Per-outbreak readouts, all derived from the same simulated infections.
    const summarize = () => {
      const end = Math.max(...infections.map(({ time }) => time).filter(Number.isFinite))
      const generation = []
      const depth = (index) => (generation[index] ??= infections[index].parent === null ? 0 : depth(infections[index].parent) + 1)
      infections.forEach((_, index) => depth(index))
      const infected = (index, time) => infections[index].time <= time
      const count = (include) => Array.from({ length: readoutSamples }, (_, sample) => {
        const time = sample / (readoutSamples - 1) * end
        return infections.reduce((total, _, index) => total + (infected(index, time) && include(index) ? 1 : 0), 0)
      })
      const everyone = count(() => true)
      const firstRoot = count((index) => infections[index].root === network.roots[0])
      const clusterSizes = [0, 1, 2].map((cluster) => network.clusters.filter((value) => value === cluster).length)
      const incidence = Array.from({ length: incidenceBins }, (_, bin) => infections.filter(({ time }) => Math.min(incidenceBins - 1, Math.floor(time / end * incidenceBins)) === bin).length)
      return {
        end,
        generation,
        maxGeneration: Math.max(1, ...generation.filter((_, index) => Number.isFinite(infections[index].time))),
        peak: Math.max(...incidence),
        total: everyone.map((value) => value / infections.length),
        clusters: [0, 1, 2].map((cluster) => count((index) => network.clusters[index] === cluster).map((value) => value / clusterSizes[cluster])),
        lineage: firstRoot.map((value, sample) => value / Math.max(1, everyone[sample])),
      }
    }
    // The network spans the top two rows; five readouts of the same outbreak sit below.
    const drawSystems = (time, reduced) => {
      if (!network) return
      const iteration = Math.floor(time / 16000)
      if (iteration !== outbreak) {
        outbreak = iteration
        infections = simulateInfection(network, 19 + iteration * 137)
        summary = summarize()
      }
      const { small } = grid()
      const cycle = (time % 16000) / 1000
      const seconds = cycle - 1.8
      const opacity = reduced ? 1 : 1 - smoothstep((cycle - 14.5) / 1.5)
      const color = colors.secondary
      const stage = panel(0, 0, 5, 2)
      const points = contactPositions(network, time / 1000).map(({ x, y }) => ({ x: stage.left + x * stage.plotWidth, y: stage.top + y * stage.plotHeight }))
      const line = (a, b) => {
        context.beginPath()
        context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke()
      }
      const grayPoint = (point, radius = small ? 1 : 1.4, visibility = 0.7) => {
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
        context.strokeStyle = colors.network; context.globalAlpha = opacity * 0.32; context.lineWidth = 1
        line(start, tip)
        if (growth < 1) grayPoint(tip, undefined, opacity * 0.7)
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
      // Line weights and marker sizes follow the Bayesian figure's posterior panels.
      context.strokeStyle = color; context.globalAlpha = opacity * 0.6; context.lineWidth = small ? 0.8 : 1.1; context.stroke()
      pulses.forEach((point) => drawFlowParticle(context, { ...point, radius: small ? 1.2 : 1.6, color, visibility: opacity * 0.8 }))
      points.forEach((point, index) => {
        const infection = infections[index]
        const infected = seconds >= infection.time
        const onset = infected ? smoothstep((seconds - infection.time) / 0.25) * opacity : 0
        grayPoint(point, undefined, 0.7 * (1 - onset))
        if (!infected) return
        drawFlowParticle(context, { ...point, radius: (small ? 1 : 1.4) + onset * (small ? 0.5 : 0.7), color, visibility: onset })
        const age = seconds - infection.time
        if (age < 0.7) {
          context.beginPath(); context.arc(point.x, point.y, 2.6 + age * 5, 0, Math.PI * 2)
          context.strokeStyle = color; context.globalAlpha = opacity * (1 - age / 0.7) * 0.3
          context.lineWidth = 0.7; context.stroke()
        }
      })

      const { end, generation, maxGeneration, peak, total, clusters, lineage } = summary
      const tip = Math.max(0, Math.min(1, seconds / end))
      const lineWidth = small ? 0.9 : 1.2
      const readout = (column) => {
        const box = panel(column, 2)
        return { ...box, at: (t, value) => ({ x: box.left + t * box.plotWidth, y: box.top + (1 - value) * box.plotHeight }) }
      }
      const marker = (point) => { if (tip < 1) drawFlowParticle(context, { ...point, radius: small ? 1.3 : 1.8, color, visibility: opacity }) }

      // 1. Share of the population infected.
      {
        const { at } = readout(0)
        const curve = sweep(total, tip, at)
        area(curve, curve.map(({ x }) => ({ x, y: at(0, 0).y })), opacity * 0.16, color)
        stroke(curve, opacity * 0.9, color, lineWidth)
        marker(curve.at(-1))
      }
      // 2. New infections per time bin: the epidemic curve.
      {
        const { left, top, plotWidth, plotHeight } = readout(1)
        const counts = new Array(incidenceBins).fill(0)
        infections.forEach(({ time }) => { if (time <= seconds) counts[Math.min(incidenceBins - 1, Math.floor(time / end * incidenceBins))] += 1 })
        const barWidth = plotWidth / incidenceBins
        context.fillStyle = color; context.globalAlpha = opacity * 0.55
        counts.forEach((value, bin) => {
          const barHeight = value / peak * plotHeight
          context.fillRect(left + bin * barWidth + 0.75, top + plotHeight - barHeight, barWidth - 1.5, barHeight)
        })
      }
      // 3. Share infected within each spatial cluster.
      {
        const { at } = readout(2)
        clusters.forEach((values, cluster) => {
          const curve = sweep(values, tip, at)
          stroke(curve, opacity * [0.95, 0.6, 0.35][cluster], color, lineWidth)
          marker(curve.at(-1))
        })
      }
      // 4. Lineage share: infections descending from each of the two seeds.
      {
        const { at } = readout(3)
        const boundary = sweep(lineage, tip, at)
        area(boundary, boundary.map(({ x }) => ({ x, y: at(0, 0).y })), opacity * 0.2, color)
        area(boundary.map(({ x }) => ({ x, y: at(0, 1).y })), boundary, opacity * 0.06, color)
        stroke(boundary, opacity * 0.9, color, lineWidth)
      }
      // 5. Transmission generation against infection time: the spreading front.
      {
        const { at } = readout(4)
        infections.forEach(({ time }, index) => {
          if (!(time <= seconds)) return
          const fresh = 1 - smoothstep((seconds - time) / 0.6)
          drawFlowParticle(context, { ...at(time / end, generation[index] / maxGeneration), radius: (small ? 0.6 : 0.9) + fresh * 0.6, color, visibility: opacity * (0.55 + fresh * 0.45) })
        })
      }
    }
    const draw = (time, reduced) => {
      context.clearRect(0, 0, width, height)
      context.lineCap = 'round'
      if (kind === 'bayesian') drawDiagnostics(time, reduced)
      else drawSystems(time, reduced)
    }
    return animateCanvas({ element: host, render: draw, resize, readColors, offset: kind === 'bayesian' ? 3500 : 0, reducedTime: 9000 })

  }, [kind, posteriors])

  return (
    <Box aria-hidden="true" data-research-figure={kind} sx={{ position: 'relative', width: '100%', ...sx }}>
      <Box component="canvas" ref={canvasRef} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </Box>
  )
}
