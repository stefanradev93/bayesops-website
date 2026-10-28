import { Box } from '@mui/material'

const viridis = ['#440154', '#3B528B', '#21918C', '#5DC963', '#FDE725']
const peaks = [
  { x: -1.8, y: -1.6, height: 1.35, width: .75 },
  { x: 1.8, y: -1.2, height: 1.1, width: .9 },
  { x: -.5, y: 2.1, height: 1.25, width: .95 },
]

const density = (x, y) => peaks.reduce((sum, peak) =>
  sum + peak.height * Math.exp(-((x - peak.x) ** 2 + (y - peak.y) ** 2) / (2 * peak.width ** 2)), 0)

const project = (x, y) => [800 + (x - y) * 91, 510 + (x + y) * 32 - density(x, y) * 185]

function colorAt(height) {
  const position = Math.min(1, height / 1.35) * (viridis.length - 1)
  const index = Math.min(viridis.length - 2, Math.floor(position))
  const mix = position - index
  return `#${[1, 3, 5].map(offset => {
    const start = parseInt(viridis[index].slice(offset, offset + 2), 16)
    const end = parseInt(viridis[index + 1].slice(offset, offset + 2), 16)
    return Math.round(start + (end - start) * mix).toString(16).padStart(2, '0')
  }).join('')}`
}

// Decorative Gaussian surfaces echo the original BayesFlow banner. Calculate
// the static mesh once on the server; no client drawing or animation is needed.
const steps = 34
const cells = Array.from({ length: steps * steps }, (_, index) => {
  const x = -4 + (index % steps) * 8 / steps
  const y = -4 + Math.floor(index / steps) * 8 / steps
  const edge = 8 / steps
  return {
    depth: x + y,
    fill: colorAt(density(x + edge / 2, y + edge / 2)),
    points: [[x, y], [x + edge, y], [x + edge, y + edge], [x, y + edge]]
      .map(([px, py]) => project(px, py).map(value => value.toFixed(1)).join(','))
      .join(' '),
  }
}).sort((a, b) => a.depth - b.depth)

export default function BayesFlowDensityBackground() {
  return (
    <Box
      aria-hidden="true"
      data-bayesflow-density-background
      sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none',
        opacity: { xs: .1, md: .14 },
        '.dark &': { opacity: { xs: .13, md: .19 } },
        maskImage: 'linear-gradient(180deg, transparent, #000 20%, #000 78%, transparent)',
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 1600 760"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
        sx={{
          display: 'block', width: '100%', height: '100%',
          maskImage: 'linear-gradient(90deg, #0004, #0007 45%, #000 75%)',
        }}
      >
        <g stroke="#FFFFFF" strokeWidth=".8" strokeLinejoin="round">
          {cells.map((cell, index) => <polygon key={index} points={cell.points} fill={cell.fill} />)}
        </g>
      </Box>
    </Box>
  )
}
