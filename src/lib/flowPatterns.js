// Distinct visual studies of transformations and transport in latent space.
// Research uses its separate, analytical flow-matching field.
export const flowPatterns = {
  'coupling-flow': { geometry: 'grid', lines: 11, particles: 72 },
  'latent-braids': { geometry: 'braids', lines: 18, particles: 72 },
  'density-ribbons': { geometry: 'ribbons', lines: 7, particles: 64 },
  'autoregressive-flow': { geometry: 'steps', lines: 9, particles: 66 },
  'transport-bridge': { geometry: 'bridge', lines: 12, particles: 70 },
  'radial-flow': { geometry: 'radial', lines: 9, particles: 64 },
  'planar-flow': { geometry: 'diagonals', lines: 13, particles: 70 },
}

export function flowPoint(geometry, progress, lane, time) {
  const tau = Math.PI * 2
  if (geometry === 'grid') {
    // Two triangular shear/coupling transformations.
    const x = progress + 0.065 * Math.sin(Math.PI * lane + time * 0.45)
    return { x, y: 0.5 + lane * 0.38 + 0.065 * Math.sin(tau * x + time * 0.35) }
  }
  if (geometry === 'braids') {
    const bundle = Math.min(2, Math.floor((lane + 1) * 1.5))
    const strand = ((lane + 1) * 1.5) % 1
    const angle = tau * progress * 1.4 - time * 0.4 + bundle * tau / 3
    return {
      x: progress,
      y: 0.5 + (bundle - 1) * 0.12 + 0.18 * Math.sin(angle) + (strand - 0.5) * 0.055,
    }
  }
  if (geometry === 'ribbons') {
    return {
      x: progress,
      y: 0.5 + 0.32 * lane + (0.07 + 0.02 * Math.cos(lane * 2)) * Math.sin(tau * progress * 1.25 - time * 0.55 + lane * 1.8) + 0.02 * Math.sin(tau * progress * 3 + time * 0.25),
    }
  }
  if (geometry === 'steps') {
    return {
      x: progress,
      y: 0.5 + 0.31 * lane + 0.1 * Math.sin(lane * 3 + time * 0.18) * Math.tanh((progress - 0.27) * 18) + 0.08 * Math.cos(lane * 4 - time * 0.18) * Math.tanh((progress - 0.68) * 18),
    }
  }
  if (geometry === 'bridge') {
    const inverse = 1 - progress
    const a = 0.5 + 0.42 * lane
    const b = 0.5 - 0.28 * lane
    const c = 0.5 + 0.23 * Math.sin(lane * Math.PI)
    const d = 0.5 + 0.3 * Math.sin(lane * Math.PI)
    return {
      x: progress,
      y: inverse ** 3 * a + 3 * inverse ** 2 * progress * b + 3 * inverse * progress ** 2 * c + progress ** 3 * d + 0.035 * Math.sin(Math.PI * progress) * Math.sin(time * 0.4 + lane * 2),
    }
  }
  if (geometry === 'radial') {
    const radius = 0.12 + (lane + 1) * 0.44
    const angle = tau * progress
    const warp = 1 + 0.09 * Math.sin(angle * 3 + time * 0.25) + 0.035 * Math.sin(time * 0.7 - radius * 9)
    return { x: 0.5 + radius * 0.47 * warp * Math.cos(angle), y: 0.5 + radius * 0.43 * warp * Math.sin(angle) }
  }
  if (geometry === 'diagonals') {
    const projection = (progress - 0.5) * 6 + lane * 1.5 + 0.6 * Math.sin(time * 0.3)
    const warp = Math.tanh(projection)
    return { x: 0.5 + 0.85 * (progress - 0.5) + 0.06 * warp, y: 0.5 + 0.85 * (progress - 0.5) + 0.28 * lane + 0.07 * warp }
  }
  throw new Error(`Unknown flow geometry: ${geometry}`)
}
