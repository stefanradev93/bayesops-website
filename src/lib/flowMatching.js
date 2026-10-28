// Analytical velocity for X_t = (1-t) X_0 + t X_1, with an independent
// Gaussian source and Gaussian-mixture target. Wall-clock changes condition a
// family of valid flow-matching problems; t remains the transport coordinate.
export const flowComponents = [
  { weight: 0.5, x: -1.1, y: -0.65, xx: 0.09, yy: 0.04, xy: 0.036 },
  { weight: 0.5, x: 1.1, y: 0.65, xx: 0.09, yy: 0.04, xy: -0.036 },
]
export const defaultFlowConfiguration = {
  source: { x: 0, y: 0, xx: 1, yy: 1, xy: 0 },
  components: flowComponents,
}

export function flowConfiguration(seconds) {
  const sx = 0.88 + 0.1 * Math.sin(seconds * 0.24)
  const sy = 0.88 + 0.1 * Math.cos(seconds * 0.2)
  const source = {
    x: 0.35 * Math.sin(seconds * 0.2),
    y: 0.15 * Math.cos(seconds * 0.23),
    xx: sx * sx,
    yy: sy * sy,
    xy: 0.18 * Math.sin(seconds * 0.17) * sx * sy,
  }
  const weight = 0.5 + 0.08 * Math.sin(seconds * 0.16)
  const components = flowComponents.map((component, index) => {
    const phase = index * 1.7
    const sigmaX = 0.27 + 0.06 * Math.sin(seconds * 0.21 + phase)
    const sigmaY = 0.2 + 0.035 * Math.cos(seconds * 0.25 + phase)
    const correlation = (index === 0 ? 1 : -1) * (0.4 + 0.18 * Math.sin(seconds * 0.18 + phase))
    return {
      weight: index === 0 ? weight : 1 - weight,
      x: component.x + 0.4 * Math.sin(seconds * 0.23 + phase),
      y: component.y + 0.2 * Math.cos(seconds * 0.19 + phase),
      xx: sigmaX * sigmaX,
      yy: sigmaY * sigmaY,
      xy: correlation * sigmaX * sigmaY,
    }
  })
  return { source, components }
}

export function flowMarginals(time, configuration = defaultFlowConfiguration) {
  const { source, components } = configuration
  return components.map((component) => ({
    weight: component.weight,
    x: (1 - time) * source.x + time * component.x,
    y: (1 - time) * source.y + time * component.y,
    xx: (1 - time) ** 2 * source.xx + time ** 2 * component.xx,
    yy: (1 - time) ** 2 * source.yy + time ** 2 * component.yy,
    xy: (1 - time) ** 2 * source.xy + time ** 2 * component.xy,
  }))
}

function flowKernel(time, configuration) {
  return flowMarginals(time, configuration).map((marginal, index) => {
    const component = configuration.components[index]
    const { source } = configuration
    const determinant = marginal.xx * marginal.yy - marginal.xy ** 2
    return {
      ...marginal,
      inverseXX: marginal.yy / determinant,
      inverseYY: marginal.xx / determinant,
      inverseXY: -marginal.xy / determinant,
      logWeight: Math.log(component.weight) - 0.5 * Math.log(determinant),
      meanX: component.x - source.x,
      meanY: component.y - source.y,
      bxx: time * component.xx - (1 - time) * source.xx,
      byy: time * component.yy - (1 - time) * source.yy,
      bxy: time * component.xy - (1 - time) * source.xy,
    }
  })
}

function kernelVelocity(point, kernel) {
  const terms = kernel.map((component) => {
    const dx = point.x - component.x
    const dy = point.y - component.y
    const inverseX = component.inverseXX * dx + component.inverseXY * dy
    const inverseY = component.inverseXY * dx + component.inverseYY * dy
    return {
      logWeight: component.logWeight - 0.5 * (dx * inverseX + dy * inverseY),
      x: component.meanX + component.bxx * inverseX + component.bxy * inverseY,
      y: component.meanY + component.bxy * inverseX + component.byy * inverseY,
    }
  })
  const maximum = Math.max(...terms.map((term) => term.logWeight))
  let sum = 0
  let x = 0
  let y = 0
  for (const term of terms) {
    const weight = Math.exp(term.logWeight - maximum)
    sum += weight
    x += weight * term.x
    y += weight * term.y
  }
  return { x: x / sum, y: y / sum }
}

export function flowMatchingVelocity(point, time, configuration = defaultFlowConfiguration) {
  return kernelVelocity(point, flowKernel(time, configuration))
}

const random = (seed) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

export function createFlowTrajectories(count, steps = 160, configuration = defaultFlowConfiguration) {
  // Time-dependent matrices are shared across particles, so adapting the field
  // to a changed source/target does not rebuild them for every ODE evaluation.
  const kernels = Array.from({ length: steps * 2 + 1 }, (_, index) => flowKernel(index / (steps * 2), configuration))
  const { source } = configuration
  const sigmaX = Math.sqrt(source.xx)
  const cross = source.xy / sigmaX
  const independentY = Math.sqrt(source.yy - cross * cross)
  return Array.from({ length: count }, (_, index) => {
    const radius = Math.sqrt(-2 * Math.log(Math.max(random(index + 11), 0.0001)))
    const angle = 2 * Math.PI * random(index + 29)
    const dx = radius * Math.cos(angle)
    const dy = radius * Math.sin(angle)
    let point = { x: source.x + sigmaX * dx, y: source.y + cross * dx + independentY * dy }
    const points = [point]
    const step = 1 / steps
    for (let frame = 0; frame < steps; frame += 1) {
      const a = kernelVelocity(point, kernels[frame * 2])
      const b = kernelVelocity({ x: point.x + a.x * step / 2, y: point.y + a.y * step / 2 }, kernels[frame * 2 + 1])
      const c = kernelVelocity({ x: point.x + b.x * step / 2, y: point.y + b.y * step / 2 }, kernels[frame * 2 + 1])
      const d = kernelVelocity({ x: point.x + c.x * step, y: point.y + c.y * step }, kernels[frame * 2 + 2])
      point = {
        x: point.x + step * (a.x + 2 * b.x + 2 * c.x + d.x) / 6,
        y: point.y + step * (a.y + 2 * b.y + 2 * c.y + d.y) / 6,
      }
      points.push(point)
    }
    return points
  })
}

export function sampleFlowTrajectory(trajectory, progress) {
  const index = Math.max(0, Math.min(1, progress)) * (trajectory.length - 1)
  const lower = Math.floor(index)
  const upper = Math.min(lower + 1, trajectory.length - 1)
  const fraction = index - lower
  return {
    x: trajectory[lower].x + (trajectory[upper].x - trajectory[lower].x) * fraction,
    y: trajectory[lower].y + (trajectory[upper].y - trajectory[lower].y) * fraction,
  }
}
