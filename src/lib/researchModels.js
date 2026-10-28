import { delaunayMesh } from './delaunay.js'

const randomGenerator = (seed) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 4294967296
}

// Prior-predictive simulations of four independent normal-normal models.
// theta ~ N(0,1), y | theta ~ N(theta, noise²), with exact conjugate posteriors.
// Randomized ranks among 64 independent posterior draws are uniform under SBC.
// See Talts et al., https://arxiv.org/abs/1804.06788.
export function createBayesianDiagnostics(count = 128, seed = 7351) {
  const random = randomGenerator(seed)
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, random()))) * Math.cos(2 * Math.PI * random())
  return [0.3, 0.45, 0.6, 0.35].map((noise) => Array.from({ length: count }, () => {
    const truth = normal()
    const observation = truth + noise * normal()
    const estimate = observation / (1 + noise ** 2)
    const deviation = noise / Math.sqrt(1 + noise ** 2)
    let rank = 0
    for (let draw = 0; draw < 64; draw += 1) if (estimate + deviation * normal() < truth) rank += 1
    return { truth, estimate, deviation, rank: (rank + random()) / 65 }
  }))
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
