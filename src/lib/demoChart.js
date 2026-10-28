// Shared look for the interactive D3 demo charts. Colors come from theme
// variables, so the charts follow light and dark mode without redrawing.

export const smoothstep = (value) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t) }

export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

export const chartSx = {
  '& svg': { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' },
  '& text': { fontFamily: 'var(--font-mono), monospace', fill: 'var(--mui-palette-text-secondary)' },
  '& text.strong': { fill: 'var(--mui-palette-text-primary)' },
  '& .axis': { fill: 'none', stroke: 'var(--mui-palette-divider)' },
  '& .guide': { stroke: 'var(--mui-palette-text-secondary)', strokeOpacity: .6 },
}

export const tooltipSx = {
  position: 'absolute', left: 0, top: 0, zIndex: 1, pointerEvents: 'none', opacity: 0, transition: 'opacity .12s',
  px: 1.25, py: .75, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1,
  fontFamily: 'var(--font-mono)', fontSize: '.65rem', lineHeight: 1.6, color: 'text.primary', whiteSpace: 'nowrap',
  boxShadow: '0 6px 18px rgb(0 0 0 / .14)',
}

// Place a tooltip beside a point, flipping left near the right edge.
export function placeTooltip(tooltip, { x, y, width, html }) {
  const flip = x > width - 190
  tooltip
    .html(html)
    .style('left', `${x + (flip ? -12 : 12)}px`)
    .style('top', `${y}px`)
    .style('transform', `translate(${flip ? '-100%' : '0'}, -50%)`)
    .style('opacity', 1)
}
