'use client'

import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { animateCanvas } from '@/lib/canvasAnimation'
import { createFlowTrajectories, flowConfiguration, sampleFlowTrajectory } from '@/lib/flowMatching'
import { drawFlowParticle, drawFlowTrail, sampleParticleTrail } from '@/lib/canvasEffects'

const transitDuration = 12000
const projectionX = 0.14
const projectionY = 0.025
const snapshotDuration = 400

function blendColor(from, to, progress) {
  const fraction = Math.max(0, Math.min(1, (progress - 0.15) / 0.7))
  const amount = fraction * fraction * (3 - 2 * fraction)
  const channels = [1, 3, 5].map((offset) => {
    const start = Number.parseInt(from.slice(offset, offset + 2), 16)
    const end = Number.parseInt(to.slice(offset, offset + 2), 16)
    return Math.round(start + (end - start) * amount).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}

// A space-time view: horizontal position is flow time, while vertical position
// is a linear projection of the analytically integrated model state.
export default function FlowMatchingField({ sx }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!canvas || !host || !context) return undefined
    let snapshots
    let width = 0
    let height = 0
    let colors = {}
    const project = (point, progress) => ({ x: width * (0.025 + progress * 0.95), y: height * (0.5 + projectionX * point.x + projectionY * point.y) })
    const interpolate = (a, b, amount) => ({ x: a.x + (b.x - a.x) * amount, y: a.y + (b.y - a.y) * amount })
    const pointAt = (a, b, progress, amount) => project(interpolate(sampleFlowTrajectory(a, progress), sampleFlowTrajectory(b, progress), amount), progress)
    const snapshotAt = (index) => createFlowTrajectories(80, 120, flowConfiguration(index * snapshotDuration / 1000))
    const readColors = () => {
      const styles = getComputedStyle(canvas)
      colors = {
        primary: styles.getPropertyValue('--mui-palette-primary-main').trim(),
        secondary: styles.getPropertyValue('--mui-palette-secondary-main').trim(),
        neutral: styles.getPropertyValue('--mui-palette-text-secondary').trim(),
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
    const drawDensity = (mean, variance, weight, x, direction, color) => {
      const sigma = Math.sqrt(variance)
      context.beginPath()
      context.moveTo(x, height * (0.5 + mean - sigma * 3))
      for (let step = 0; step <= 64; step += 1) {
        const z = -3 + step / 64 * 6
        const density = weight * Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
        context.lineTo(x + direction * density * width * 0.006, height * (0.5 + mean + sigma * z))
      }
      context.lineTo(x, height * (0.5 + mean + sigma * 3))
      context.closePath()
      context.fillStyle = color
      context.globalAlpha = 0.07
      context.fill()
      context.strokeStyle = color
      context.globalAlpha = 0.2
      context.lineWidth = 0.8
      context.stroke()
    }
    const draw = (time, reduced) => {
      const snapshotIndex = Math.floor(time / snapshotDuration)
      if (snapshots?.index !== snapshotIndex) {
        const current = snapshots?.index === snapshotIndex - 1 ? snapshots.next : snapshotAt(snapshotIndex)
        snapshots = { index: snapshotIndex, current, next: snapshotAt(snapshotIndex + 1) }
      }
      const amount = time / snapshotDuration - snapshotIndex
      const configuration = flowConfiguration(time / 1000)
      context.clearRect(0, 0, width, height)
      context.lineCap = 'round'

      // Reintegrate the analytical field for changing endpoint distributions.
      // Interpolating close snapshots keeps the animation smooth between solves.
      for (const [index, trajectory] of snapshots.current.entries()) {
        const next = snapshots.next[index]
        const endpoint = interpolate(trajectory[trajectory.length - 1], next[next.length - 1], amount)
        const targetColor = endpoint.x < 0 ? colors.secondary : colors.primary
        const gradient = context.createLinearGradient(width * 0.025, 0, width * 0.975, 0)
        gradient.addColorStop(0, colors.neutral)
        gradient.addColorStop(0.25, colors.neutral)
        gradient.addColorStop(1, targetColor)
        context.beginPath()
        for (let step = 0; step < trajectory.length; step += 2) {
          const point = project(interpolate(trajectory[step], next[step], amount), step / (trajectory.length - 1))
          if (!step) context.moveTo(point.x, point.y)
          else context.lineTo(point.x, point.y)
        }
        context.strokeStyle = gradient
        context.globalAlpha = 0.09
        context.lineWidth = 0.85
        context.stroke()
      }

      const { source } = configuration
      const sourceMean = projectionX * source.x + projectionY * source.y
      const sourceVariance = projectionX ** 2 * source.xx + 2 * projectionX * projectionY * source.xy + projectionY ** 2 * source.yy
      drawDensity(sourceMean, sourceVariance, 1, width * 0.025, 1, colors.neutral)
      for (const [index, component] of configuration.components.entries()) {
        const mean = projectionX * component.x + projectionY * component.y
        const variance = projectionX ** 2 * component.xx + 2 * projectionX * projectionY * component.xy + projectionY ** 2 * component.yy
        drawDensity(mean, variance, component.weight, width * 0.975, -1, index === 0 ? colors.secondary : colors.primary)
      }

      for (const [index, trajectory] of snapshots.current.entries()) {
        const next = snapshots.next[index]
        const progress = (index * 0.61803398875 + time / transitDuration) % 1
        const point = pointAt(trajectory, next, progress, amount)
        const endpoint = interpolate(trajectory[trajectory.length - 1], next[next.length - 1], amount)
        const color = blendColor(colors.neutral, endpoint.x < 0 ? colors.secondary : colors.primary, progress)
        const fade = Math.min(1, progress / 0.05, (1 - progress) / 0.05)
        const radius = 1.3 + index % 3 * 0.3
        const points = reduced ? [point] : sampleParticleTrail((pastTime) => pointAt(trajectory, next, Math.max(0, progress - (time - pastTime) / transitDuration), amount), time, {
          maxLength: width < 600 ? 16 : 24, earliestTime: time - progress * transitDuration,
        })
        drawFlowTrail(context, { points, color, lineWidth: 0.45 + radius * 0.7, visibility: fade })
        drawFlowParticle(context, { ...point, radius, color, visibility: fade })
      }
    }
    return animateCanvas({ element: host, render: draw, resize, readColors, offset: 3000 })

  }, [])

  return (
    <Box aria-hidden="true" data-flow-animation="flow-matching" sx={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none', ...sx }}>
      <Box component="canvas" ref={canvasRef} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </Box>
  )
}
