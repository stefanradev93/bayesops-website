'use client'

import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { animateCanvas } from '@/lib/canvasAnimation'
import { diffusionMotionAt, retimeDiffusionTrajectories } from '@/lib/diffusionMotion'
import { drawFlowParticle, drawFlowTrail, sampleParticleTrail } from '@/lib/canvasEffects'

const particleCount = (width) => Math.max(70, Math.min(150, Math.round(width / 9)))
const travelDuration = 9000
const trailDuration = 200
const modelScale = 0.2
const diffusionHorizon = 7
const flowSteps = 240
const pathWidth = 1.2
const posteriorModes = [
  { x: 0.35, y: 0.4, weight: 0.46, correlation: 0.55 },
  { x: 0.65, y: 0.6, weight: 0.54, correlation: -0.55 },
]
const targetSigmaX = 0.22
const targetSigmaY = 0.17

const random = (seed) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

const clamp = (value, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value))

const smoothstep = (value) => {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}

function blendColor(from, to, amount) {
  const channels = [1, 3, 5].map((offset) => {
    const start = Number.parseInt(from.slice(offset, offset + 2), 16)
    const end = Number.parseInt(to.slice(offset, offset + 2), 16)
    return Math.round(start + (end - start) * amount).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}

function makeParticles(count) {
  return Array.from({ length: count }, (_, index) => {
    const r1 = Math.max(random(index + 11), 0.0001)
    const r2 = random(index + 29)
    const gaussian = Math.sqrt(-2 * Math.log(r1))
    return {
      dx: gaussian * Math.cos(2 * Math.PI * r2),
      dy: gaussian * Math.sin(2 * Math.PI * r2),
      cluster: random(index + 41) > posteriorModes[0].weight ? 1 : 0,
      size: 0.7 + random(index + 67) * 1.8,
    }
  })
}

// For the forward SDE dx = -x/2 dt + dW, each component has mean
// exp(-t/2) mu and covariance exp(-t) Sigma + (1-exp(-t)) I.
// The exact mixture score supplies the probability-flow ODE
// dx/dt = -(x + score_t(x))/2. Replaying its paths backwards denoises.
// This is a known toy density, with no trained model or invented vector field.
function mixtureScore(point, time) {
  const alphaSquared = Math.exp(-time)
  const alpha = Math.sqrt(alphaSquared)
  const noiseVariance = -Math.expm1(-time)
  const xx = alphaSquared * targetSigmaX ** 2 + noiseVariance
  const yy = alphaSquared * targetSigmaY ** 2 + noiseVariance
  const components = posteriorModes.map((mode) => {
    const xy = alphaSquared * mode.correlation * targetSigmaX * targetSigmaY
    const determinant = xx * yy - xy * xy
    const dx = point.x - alpha * (mode.x - 0.5) / modelScale
    const dy = point.y - alpha * (mode.y - 0.5) / modelScale
    const inverseX = (yy * dx - xy * dy) / determinant
    const inverseY = (xx * dy - xy * dx) / determinant
    return {
      logDensity: Math.log(mode.weight) - 0.5 * Math.log(determinant) - 0.5 * (dx * inverseX + dy * inverseY),
      x: -inverseX,
      y: -inverseY,
    }
  })
  const maxLog = Math.max(...components.map((component) => component.logDensity))
  let weightSum = 0
  let x = 0
  let y = 0
  for (const component of components) {
    const weight = Math.exp(component.logDensity - maxLog)
    weightSum += weight
    x += weight * component.x
    y += weight * component.y
  }
  return { x: x / weightSum, y: y / weightSum }
}

function flowVelocity(point, time) {
  const score = mixtureScore(point, time)
  return { x: -0.5 * (point.x + score.x), y: -0.5 * (point.y + score.y) }
}

function flowStep(point, time, step) {
  const k1 = flowVelocity(point, time)
  const k2 = flowVelocity({ x: point.x + k1.x * step / 2, y: point.y + k1.y * step / 2 }, time + step / 2)
  const k3 = flowVelocity({ x: point.x + k2.x * step / 2, y: point.y + k2.y * step / 2 }, time + step / 2)
  const k4 = flowVelocity({ x: point.x + k3.x * step, y: point.y + k3.y * step }, time + step)
  return {
    x: point.x + step * (k1.x + 2 * k2.x + 2 * k3.x + k4.x) / 6,
    y: point.y + step * (k1.y + 2 * k2.y + 2 * k3.y + k4.y) / 6,
  }
}

function makeTrajectory(particle) {
  const mode = posteriorModes[particle.cluster]
  let point = {
    x: (mode.x - 0.5) / modelScale + targetSigmaX * particle.dx,
    y: (mode.y - 0.5) / modelScale + targetSigmaY * (mode.correlation * particle.dx + Math.sqrt(1 - mode.correlation ** 2) * particle.dy),
  }
  const project = ({ x, y }) => ({ x: 0.5 + x * modelScale, y: 0.5 + y * modelScale })
  const points = [project(point)]
  for (let index = 1; index <= flowSteps; index += 1) {
    // Resolve the rapid change near clean data with a finer integration grid.
    const previousTime = diffusionHorizon * ((index - 1) / flowSteps) ** 2
    const nextTime = diffusionHorizon * (index / flowSteps) ** 2
    point = flowStep(point, previousTime, nextTime - previousTime)
    points.push(project(point))
  }
  return points
}

function pointOnTrajectory(trajectory, progress) {
  const index = (1 - clamp(progress)) * (trajectory.length - 1)
  const lower = Math.floor(index)
  const upper = Math.min(lower + 1, trajectory.length - 1)
  const fraction = index - lower
  return {
    x: trajectory[lower].x + (trajectory[upper].x - trajectory[lower].x) * fraction,
    y: trajectory[lower].y + (trajectory[upper].y - trajectory[lower].y) * fraction,
  }
}

const modelTrajectories = []

const motionAt = (time) => diffusionMotionAt(time, travelDuration)

function sampleTrail(trajectory, time, maxLength) {
  return sampleParticleTrail((pastTime) => pointOnTrajectory(trajectory, motionAt(pastTime).progress), time, {
    duration: trailDuration, maxLength, earliestTime: motionAt(time).legStart,
  })
}

/** Analytical probability-flow diffusion for an illustrative two-Gaussian target. */
export default function DiffusionField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined
    let width = 0
    let height = 0
    let particles = []
    let trajectories = []
    let colors = {}
    let paths = []
    let ribbons = []
    let contours = []

    const readColors = () => {
      const dark = document.documentElement.classList.contains('dark')
      const styles = getComputedStyle(canvas)
      contours = []
      colors = {
        primary: styles.getPropertyValue('--mui-palette-secondary-main').trim(),
        secondary: styles.getPropertyValue('--mui-palette-primary-main').trim(),
        neutral: dark ? '#ACA5BD' : '#7D778E',
      }
    }

    const resize = () => {
      const bounds = host.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      if (width === bounds.width && height === bounds.height && canvas.width === Math.round(bounds.width * ratio) && canvas.height === Math.round(bounds.height * ratio)) return
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      particles = makeParticles(particleCount(width))
      trajectories = retimeDiffusionTrajectories(particles.map((particle, index) => {
        if (!modelTrajectories[index]) modelTrajectories[index] = makeTrajectory(particle)
        return modelTrajectories[index].map(({ x, y }) => ({ x: x * width, y: y * height }))
      }))
      paths = trajectories.map((trajectory) => {
        const path = new Path2D()
        path.moveTo(trajectory[0].x, trajectory[0].y)
        for (let step = 2; step < trajectory.length; step += 2) path.lineTo(trajectory[step].x, trajectory[step].y)
        const last = trajectory[trajectory.length - 1]
        path.lineTo(last.x, last.y)
        return path
      })
      ribbons = trajectories.map((trajectory) => {
        const points = trajectory.filter((_, step) => step % 2 === 0 || step === trajectory.length - 1)
        const distances = [0]
        for (let step = 1; step < points.length; step += 1) {
          distances.push(distances[step - 1] + Math.hypot(points[step].x - points[step - 1].x, points[step].y - points[step - 1].y))
        }
        const length = distances[distances.length - 1] || 1
        return points.map((point, step) => {
          const before = points[Math.max(0, step - 1)]
          const after = points[Math.min(points.length - 1, step + 1)]
          const dx = after.x - before.x, dy = after.y - before.y
          const span = Math.hypot(dx, dy) || 1
          return { x: point.x, y: point.y, nx: -dy / span, ny: dx / span, along: distances[step] / length }
        })
      })
      contours = []
    }

    const drawPaths = (time, reveal, wave, reduced) => {
      const tints = [colors.primary, colors.secondary].map((color) => blendColor(colors.neutral, color, reveal))
      trajectories.forEach((_, index) => {
        const breath = reduced ? 1 : 0.78 + 0.22 * Math.sin(time * 0.00065 + index * 0.7)
        context.strokeStyle = tints[particles[index].cluster]
        context.fillStyle = tints[particles[index].cluster]
        context.globalAlpha = (0.05 + reveal * 0.04) * breath
        if (wave < 0.01) {
          context.lineWidth = pathWidth
          context.stroke(paths[index])
          return
        }
        // Thickness crests travel toward the data end (along = 0) of the path.
        const ribbon = ribbons[index]
        const phase = time * 0.0005 + index * 0.37
        const radii = ribbon.map(({ along }) => {
          const pulse = (0.5 + 0.5 * Math.sin(2 * Math.PI * (along * 3 + phase))) ** 2
          return pathWidth * 0.5 * (1 + wave * 2.2 * pulse)
        })
        context.beginPath()
        ribbon.forEach(({ x, y, nx, ny }, step) => context.lineTo(x + nx * radii[step], y + ny * radii[step]))
        for (let step = ribbon.length - 1; step >= 0; step -= 1) {
          context.lineTo(ribbon[step].x - ribbon[step].nx * radii[step], ribbon[step].y - ribbon[step].ny * radii[step])
        }
        context.closePath()
        context.fill()
      })
    }

    const drawContours = (progress) => {
      posteriorModes.forEach((mode, cluster) => {
        const sigmaX = width * modelScale * targetSigmaX
        const sigmaY = height * modelScale * targetSigmaY
        const color = cluster === 0 ? colors.primary : colors.secondary

        // Shade in standardized Gaussian coordinates, using the same covariance
        // as the samples and contours so the fill follows the actual density.
        context.save()
        context.translate(width * mode.x, height * mode.y)
        context.transform(sigmaX, mode.correlation * sigmaY, 0, sigmaY * Math.sqrt(1 - mode.correlation ** 2), 0, 0)
        const cached = contours[cluster] || { rings: [] }
        const shading = cached.shading || context.createRadialGradient(0, 0, 0, 0, 0, 3.4)
        if (!cached.shading) for (let step = 0; step <= 17; step += 1) {
          const radius = step * 0.2
          const alpha = step === 17 ? 0 : Math.round(255 * Math.exp(-0.5 * radius ** 2))
          shading.addColorStop(step / 17, `${color}${alpha.toString(16).padStart(2, '0')}`)
        }
        cached.shading = shading
        context.fillStyle = shading
        context.globalAlpha = (0.14 + progress * 0.1) * mode.weight / 0.54
        context.beginPath()
        context.arc(0, 0, 3.4, 0, Math.PI * 2)
        context.fill()
        context.restore()

        context.save()
        for (let ring = 0; ring < 4; ring += 1) {
          const level = 1 + ring * 0.8
          let path = cached.rings[ring]
          if (!path) {
            path = new Path2D()
            for (let step = 0; step <= 64; step += 1) {
              const angle = step / 64 * Math.PI * 2
              const x = width * mode.x + level * sigmaX * Math.cos(angle)
              const y = height * mode.y + level * sigmaY * (mode.correlation * Math.cos(angle) + Math.sqrt(1 - mode.correlation ** 2) * Math.sin(angle))
              if (step === 0) path.moveTo(x, y)
              else path.lineTo(x, y)
            }
            path.closePath()
            cached.rings[ring] = path
          }
          const emphasis = 1 - ring * 0.13
          // A soft colored halo under a fine, brighter core keeps the rings crisp.
          context.globalAlpha = (0.1 + progress * 0.05) * emphasis
          context.strokeStyle = color
          context.lineWidth = 2.8
          context.shadowColor = color
          context.shadowBlur = 7
          context.stroke(path)
          context.shadowBlur = 0
          context.globalAlpha = (0.3 + progress * 0.13) * emphasis
          context.strokeStyle = blendColor(color, '#FFFFFF', 0.18)
          context.lineWidth = 0.85
          context.stroke(path)
        }
        context.restore()
        contours[cluster] = cached
      })
    }

    const draw = (time, reduced) => {
      const { progress, converging } = motionAt(time)
      const reveal = smoothstep((progress - 0.3) / 0.65)
      // The thickness wave runs only while samples converge; it eases in and out
      // around each reversal so dispersal settles back to a fixed width.
      const wave = reduced ? 0
        : converging ? smoothstep(progress / 0.15) : smoothstep((progress - 0.85) / 0.15)

      context.clearRect(0, 0, width, height)
      context.lineCap = 'round'
      drawPaths(time, reveal, wave, reduced)
      drawContours(progress)

      const tints = [colors.primary, colors.secondary].map((color) => blendColor(colors.neutral, color, reveal))
      trajectories.forEach((trajectory, index) => {
        const particle = particles[index]
        const color = tints[particle.cluster]
        const points = reduced
          ? [pointOnTrajectory(trajectory, 1)]
          : sampleTrail(trajectory, time, width < 600 ? 16 : 24)
        const position = points[0]
        drawFlowTrail(context, { points, color, lineWidth: 0.8 + particle.size * 0.55 })

        drawFlowParticle(context, { ...position, radius: particle.size * 0.8 + 0.5, color })
      })

    }
    return animateCanvas({ element: host, render: draw, resize, readColors, offset: 500, reducedTime: travelDuration })

  }, [])

  return (
    <Box
      ref={canvasRef}
      component="canvas"
      aria-hidden="true"
      sx={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%' }}
    />
  )
}
