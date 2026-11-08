import { delaunayMesh } from './delaunay.js'

const randomGenerator = (seed) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 4294967296
}

const normalGenerator = (random) => () => Math.sqrt(-2 * Math.log(Math.max(1e-9, random()))) * Math.cos(2 * Math.PI * random())

// Prior-predictive simulations of six independent normal-normal models.
// theta ~ N(0,1), y | theta ~ N(theta, noise²), with exact conjugate posteriors.
export function createBayesianDiagnostics(count = 128, seed = 7351) {
  const normal = normalGenerator(randomGenerator(seed))
  return [0.3, 0.45, 0.6, 0.35, 0.5, 0.25].map((noise) => Array.from({ length: count }, () => {
    const truth = normal()
    const observation = truth + noise * normal()
    return { truth, estimate: observation / (1 + noise ** 2), deviation: noise / Math.sqrt(1 + noise ** 2) }
  }))
}

// Lower Cholesky factor of a symmetric positive-definite matrix (array of rows).
function cholesky(matrix) {
  const size = matrix.length
  const factor = Array.from({ length: size }, () => new Float64Array(size))
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let sum = matrix[row][column]
      for (let k = 0; k < column; k += 1) sum -= factor[row][k] * factor[column][k]
      factor[row][column] = row === column ? Math.sqrt(sum) : sum / factor[column][column]
    }
  }
  return factor
}

// Solves factor · x = vector for a lower-triangular factor.
function forwardSolve(factor, vector) {
  const solution = new Float64Array(vector.length)
  for (let row = 0; row < vector.length; row += 1) {
    let sum = vector[row]
    for (let k = 0; k < row; k += 1) sum -= factor[row][k] * solution[k]
    solution[row] = sum / factor[row][row]
  }
  return solution
}

// Six time-varying parameters with Gaussian-process priors: theta ~ GP(0, k) with a
// squared-exponential kernel over trials, and y_t ~ N(theta_t, noise²). The exact
// posterior of each theta_t conditions on the whole sequence, like Superstats'
// trial-wise marginals.
export function createTimeVaryingPosteriors(steps = 100, seed = 4127) {
  const normal = normalGenerator(randomGenerator(seed))
  return [[14, 0.45], [10, 0.35], [18, 0.55], [8, 0.3], [12, 0.5], [16, 0.4]].map(([lengthscale, noise]) => {
    const kernel = Array.from({ length: steps }, (_, row) => Array.from({ length: steps }, (_, column) => Math.exp(-((row - column) ** 2) / (2 * lengthscale ** 2)) + (row === column ? 1e-6 : 0)))
    const priorFactor = cholesky(kernel)
    const draws = Array.from({ length: steps }, normal)
    const truth = priorFactor.map((row) => row.reduce((sum, value, k) => sum + value * draws[k], 0))
    const observations = truth.map((value) => value + noise * normal())
    // With A = K + noise²·I = C·Cᵀ: mean = K·A⁻¹·y and var_t = k_tt − |C⁻¹·k_t|².
    const factor = cholesky(kernel.map((row, index) => row.map((value, column) => value + (index === column ? noise ** 2 : 0))))
    const whitened = forwardSolve(factor, observations)
    const projections = kernel.map((column) => forwardSolve(factor, column))
    return {
      truth,
      median: projections.map((projection) => projection.reduce((sum, value, k) => sum + value * whitened[k], 0)),
      deviation: projections.map((projection, index) => Math.sqrt(Math.max(0, kernel[index][index] - projection.reduce((sum, value) => sum + value * value, 0)))),
    }
  })
}

// A space-time Gaussian random field on the unit square with a separable
// squared-exponential kernel, approximated by random Fourier features
// (Rahimi & Recht, 2007). Unit marginal variance; any grid size samples the same field.
export function createRandomField({ features = 64, lengthscale = 0.2, timescale = 2.5, seed = 9182 } = {}) {
  const random = randomGenerator(seed)
  const normal = normalGenerator(random)
  return Array.from({ length: features }, () => ({
    x: normal() / lengthscale, y: normal() / lengthscale, t: normal() / timescale, phase: 2 * Math.PI * random(),
  }))
}

// cos(a + b) splits into row and column factors, so an n×n grid costs O(n) trig per feature.
export function sampleRandomField(field, size, time, values = new Float32Array(size * size)) {
  values.fill(0)
  const scale = Math.sqrt(2 / field.length)
  const columnCos = new Float32Array(size), columnSin = new Float32Array(size)
  for (const { x, y, t, phase } of field) {
    for (let column = 0; column < size; column += 1) {
      const angle = x * (column + 0.5) / size
      columnCos[column] = Math.cos(angle); columnSin[column] = Math.sin(angle)
    }
    for (let row = 0; row < size; row += 1) {
      const angle = y * (row + 0.5) / size + t * time + phase
      const rowCos = scale * Math.cos(angle), rowSin = scale * Math.sin(angle)
      for (let column = 0, index = row * size; column < size; column += 1, index += 1) {
        values[index] += columnCos[column] * rowCos - columnSin[column] * rowSin
      }
    }
  }
  return values
}

const calibrationOrders = new WeakMap()

// Cache rank order; only the observation weights change during playback.
// A fractional last observation smoothly interpolates consecutive empirical CDFs.
export function calibrationDifference(samples, count) {
  let order = calibrationOrders.get(samples)
  if (!order) {
    order = samples.map(({ rank }, index) => ({ rank, index })).sort((a, b) => a.rank - b.rank)
    calibrationOrders.set(samples, order)
  }
  const total = Math.max(0, Math.min(samples.length, count))
  if (!total) return [{ x: 0, y: 0 }, { x: 1, y: 0 }]
  const points = [{ x: 0, y: 0 }]
  let cumulative = 0
  order.forEach(({ rank, index }) => {
    const weight = Math.max(0, Math.min(1, count - index))
    if (!weight) return
    points.push({ x: rank, y: cumulative / total - rank })
    cumulative += weight
    points.push({ x: rank, y: cumulative / total - rank })
  })
  points.push({ x: 1, y: 0 })
  return points
}

const contactCenters = [{ x: 0.22, y: 0.32 }, { x: 0.52, y: 0.7 }, { x: 0.81, y: 0.35 }]

// Binomial standard-error envelope: approximate pointwise 95% limits under
// uniformity, rather than simultaneous limits for the full ECDF.
export function calibrationEnvelope(probability, count) {
  const p = Math.max(0, Math.min(1, probability))
  return 1.96 * Math.sqrt(p * (1 - p) / Math.max(1, count))
}

export function calibrationLimit(curve, count) {
  const extent = Math.max(...curve.map(({ y }) => Math.abs(y)), calibrationEnvelope(0.5, count))
  return Math.max(0.025, extent * 1.2)
}

// A spatial contact network, inspired by Fig. 15 of Lavin et al. (2021).
export function createContactNetwork(aspectRatio = 1.75) {
  const random = randomGenerator(214)
  const columns = 16, rows = 8
  const nodes = Array.from({ length: columns * rows }, (_, index) => ({
    x: 0.05 + 0.9 * (index % columns + (random() - 0.5) * 0.6) / (columns - 1),
    y: 0.07 + 0.86 * (Math.floor(index / columns) + (random() - 0.5) * 0.6) / (rows - 1),
  }))
  const mesh = delaunayMesh(nodes, aspectRatio)
  const edgeLength = ([a, b]) => Math.hypot((nodes[a].x - nodes[b].x) * aspectRatio, nodes[a].y - nodes[b].y)
  const lengths = mesh.edges.map(edgeLength).sort((a, b) => a - b)
  const maxEdgeLength = lengths[Math.floor(lengths.length / 2)] * 1.9
  const edges = mesh.edges.filter((edge) => edgeLength(edge) <= maxEdgeLength)
  const existing = new Set(edges.map(([a, b]) => `${Math.min(a, b)},${Math.max(a, b)}`))
  const candidates = []
  for (let a = 0; a < nodes.length; a += 1) {
    for (let b = a + 1; b < nodes.length; b += 1) {
      const distance = Math.hypot((nodes[a].x - nodes[b].x) * aspectRatio, nodes[a].y - nodes[b].y)
      if (!existing.has(`${a},${b}`) && distance > Math.min(0.14, maxEdgeLength * 0.7) && distance < Math.min(0.22, maxEdgeLength)) candidates.push({ a, b })
    }
  }
  const connections = [3.8, 9.8].flatMap((createdAt) => candidates.length ? [{
    ...candidates.splice(Math.floor(random() * candidates.length), 1)[0], createdAt, availableAt: createdAt + 1.2,
  }] : [])
  const roots = [columns * 2 + 5, columns * 5 + 10]
  const squaredDistance = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2
  const clusters = nodes.map((point) => contactCenters.reduce((best, center, candidate) =>
    squaredDistance(point, center) < squaredDistance(point, contactCenters[best]) ? candidate : best, 0))
  return { nodes, edges, connections, roots, maxEdgeLength, clusters }
}

export function contactPositions(network, seconds) {
  const movement = 1 - Math.exp(-Math.max(0, seconds) / 3)
  const attractions = contactCenters.map((_, cluster) => 0.2 * (0.5 + 0.5 * Math.sin(seconds * 0.26 + cluster * 2.1)))
  return network.nodes.map((point, index) => {
    const cluster = network.clusters[index]
    const center = contactCenters[cluster]
    const attraction = attractions[cluster]
    return {
      x: point.x + movement * ((center.x - point.x) * attraction + 0.012 * Math.sin(seconds * 0.38 + index * 2.4)),
      y: point.y + movement * ((center.y - point.y) * attraction + 0.018 * Math.sin(seconds * 0.31 + index * 1.7)),
    }
  })
}

// Continuous-time susceptible → infected propagation. Each infected agent
// schedules an exponential transmission delay on each of its contact edges.
// This records transmission ancestry; it does not perform causal discovery.
export function simulateInfection(network, seed = 19) {
  const random = randomGenerator(seed)
  const neighbors = network.nodes.map(() => [])
  const contacts = [
    ...network.edges.map(([a, b]) => ({ a, b, availableAt: 0 })),
    ...(network.connections || []),
  ]
  contacts.forEach(({ a, b, availableAt }) => {
    const delay = () => 0.3 - Math.log(Math.max(1e-9, 1 - random())) * 1.4
    neighbors[a].push({ node: b, availableAt, delay: delay() })
    neighbors[b].push({ node: a, availableAt, delay: delay() })
  })
  const propagate = (scale, includeNew) => {
    const infections = network.nodes.map(() => ({ time: Infinity, parent: null, root: null, availableAt: 0 }))
    const pending = network.roots.map((root) => ({ node: root, time: 0, parent: null, root, availableAt: 0 }))
    while (pending.length) {
      pending.sort((a, b) => b.time - a.time)
      const event = pending.pop()
      if (infections[event.node].time <= event.time) continue
      infections[event.node] = { time: event.time, parent: event.parent, root: event.root, availableAt: event.availableAt }
      for (const contact of neighbors[event.node]) {
        if (infections[contact.node].time < Infinity || (!includeNew && contact.availableAt)) continue
        pending.push({ node: contact.node, time: Math.max(event.time, contact.availableAt) + contact.delay * scale, parent: event.node, root: event.root, availableAt: contact.availableAt })
      }
    }
    return infections
  }
  // Calibrate the baseline run to twelve seconds, then add the temporal links.
  // New contacts can accelerate spread only after they have finished forming.
  const baseline = propagate(1, false)
  const scale = 12 / Math.max(...baseline.map(({ time }) => time))
  return propagate(scale, true)
}
