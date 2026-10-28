import { Box } from '@mui/material'

// Abstract density contours, used as a quiet visual signature rather than data.
function contourPath(ring, offset = 0) {
  return Array.from({ length: 97 }, (_, index) => {
    const angle = (index / 96) * Math.PI * 2
    const radius = 28 + ring * 15
    const shape = 1 + 0.17 * Math.sin(angle * 2 + offset) + 0.08 * Math.cos(angle * 3)
    const x = 300 + Math.cos(angle) * radius * shape * 1.45 + Math.sin(angle) * radius * 0.35
    const y = 250 + Math.sin(angle) * radius * shape * 0.85
    return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ') + 'Z'
}

export default function ScientificField({ sx, rotation = 0 }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 600 500"
      fill="none"
      aria-hidden="true"
      focusable="false"
      sx={{ display: 'block', width: '100%', height: '100%', color: 'primary.main', pointerEvents: 'none', ...sx }}
    >
      <g stroke="currentColor" strokeWidth="0.65" opacity="0.18">
        {[100, 200, 300, 400, 500].flatMap((x) =>
          [100, 200, 300, 400].map((y) => (
            <path key={`${x}-${y}`} d={`M${x - 4} ${y}h8M${x} ${y - 4}v8`} />
          )),
        )}
      </g>
      <g stroke="currentColor" strokeWidth="0.8" transform={`rotate(${rotation} 300 250)`}>
        {Array.from({ length: 11 }, (_, ring) => (
          <path key={ring} d={contourPath(ring)} opacity={0.46 - ring * 0.028} />
        ))}
      </g>
      <circle cx="300" cy="250" r="3" fill="currentColor" opacity="0.6" />
      <path d="M300 250h96l34-38h68" stroke="currentColor" strokeWidth="0.6" opacity="0.35" transform={`rotate(${rotation} 300 250)`} />
    </Box>
  )
}
