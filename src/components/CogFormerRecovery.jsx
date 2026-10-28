'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import PauseRounded from '@mui/icons-material/PauseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import { animateCanvas } from '@/lib/canvasAnimation'

const parameters = ['v', 'a', 'z', 'τ', 'sᵥ', 'sτ', 'v diff', 'v θ']
const columns = parameters.length
const combinations = 2 ** columns
const effects = ['Intercept', 'Main effect 1', 'Main effect 2', 'Interaction']
const STEP = 1800
const CYCLE = STEP * 12 + 4000
const colors = ['#df776d', '#d78a39', '#b3a82b', '#8cb833', '#30b56b', '#29aa91', '#32aeba', '#419fce', '#818ed2', '#a979c9', '#d27abf', '#da7f9c']
const random = (seed) => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n) }
// Illustrative family-specific parameter sets, not a demo support matrix.
const families = [
  { name: 'DDM', parameters: 0b00111111 },
  { name: 'RDM', parameters: 0b01111011 },
  { name: 'CDM', parameters: 0b10111011 },
]
const designs = families.flatMap((family, familyIndex) => {
  const group = []
  for (let seed = familyIndex * 100 + 1; group.length < 4; seed++) {
    const first = Math.floor(random(seed) * combinations) & family.parameters
    const second = Math.floor(random(seed + 101) * combinations) & family.parameters
    const interaction = Math.floor(random(seed + 211) * combinations) & first & second
    const mask = [family.parameters, first, second, interaction]
    if (group.some(design => design.mask.every((value, row) => value === mask[row]))) continue
    const index = familyIndex * 4 + group.length
    group.push({ mask, family: family.name, color: colors[index], name: `${family.name} · ${group.length + 1}` })
  }
  return group
})
// Cover every interaction in an eligible family, retaining both main effects.
parameters.forEach((_, column) => {
  const bit = 1 << column
  if (designs.some(design => design.mask[3] & bit)) return
  const eligible = designs.filter(design => design.mask[0] & bit)
  const { mask } = eligible[column % eligible.length]
  mask[1] |= bit
  mask[2] |= bit
  mask[3] |= bit
})
// Synthetic recovery samples, not network output.
const samples = designs.map((_, design) => effects.map((_, row) => parameters.map((_, column) =>
  Array.from({ length: 22 }, (_, point) => {
    const seed = design * 10000 + row * 1000 + column * 100 + point + 1
    const truth = (random(seed) - .5) * 1.65
    const noise = .28 + column * .04
    const estimate = Math.max(-.95, Math.min(.95, truth * .96 + (random(seed + 41) - .5) * noise))
    return { truth, estimate, interval: .08 + random(seed + 91) * .17 }
  })
)))

export default function CogFormerRecovery() {
  const canvasRef = useRef(null)
  const controlsRef = useRef({})
  const pausedRef = useRef(false)
  const clockRef = useRef(0)
  const [paused, setPaused] = useState(false)
  const [active, setActive] = useState(0)
  const setPlayback = (value) => {
    pausedRef.current = value
    setPaused(value)
    controlsRef.current.setPaused?.(value)
  }
  const choose = (index) => {
    setPlayback(true)
    controlsRef.current.seek?.(index * STEP)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = 0, height = 0, selected = -1
    let theme = {}
    const readColors = () => {
      const style = getComputedStyle(canvas)
      theme = { strong: style.getPropertyValue('--mui-palette-text-primary').trim(), text: style.getPropertyValue('--mui-palette-text-secondary').trim(), line: style.getPropertyValue('--mui-palette-divider').trim(), font: style.getPropertyValue('--font-mono').trim() || 'monospace' }
    }
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = bounds.width; height = bounds.height
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const render = (time) => {
      clockRef.current = time
      const phase = time % CYCLE
      const ensemble = phase >= STEP * designs.length
      const current = ensemble ? -1 : Math.floor(phase / STEP)
      if (selected !== current) { selected = current; setActive(current) }
      ctx.clearRect(0, 0, width, height)
      const left = 54, top = 30, bottom = 30, columnGap = 18, rowGap = 30
      const size = Math.max(1, Math.min((width - left - 8 - columnGap * (columns - 1)) / columns, (height - top - bottom - rowGap * 3) / 4))
      const offsetX = (width - left - 8 - size * columns - columnGap * (columns - 1)) / 2
      const offsetY = (height - top - bottom - size * 4 - rowGap * 3) / 2
      const label = (text, x, y, fontSize = 8, align = 'center', strong = false) => {
        ctx.globalAlpha = 1; ctx.fillStyle = strong ? theme.strong : theme.text
        ctx.font = `${fontSize}px ${theme.font}`; ctx.textAlign = align; ctx.fillText(text, x, y)
      }
      const path = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke() }
      parameters.forEach((parameter, column) => label(parameter, offsetX + left + column * (size + columnGap) + size / 2, offsetY + 16, 15, 'center', true))
      effects.forEach((effect, row) => {
        const y = offsetY + top + row * (size + rowGap)
        ctx.save(); ctx.translate(offsetX + 10, y + size / 2); ctx.rotate(-Math.PI / 2); label(effect, 0, 0, 9); ctx.restore()
        parameters.forEach((_, column) => {
          const x = offsetX + left + column * (size + columnGap)
          const px = value => x + (value + 1) * size / 2
          const py = value => y + (1 - value) * size / 2
          // Match BayesFlow: open L-shaped axes, no panel boxes or grid lines.
          ctx.globalAlpha = 1; ctx.strokeStyle = theme.line; ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + size); ctx.lineTo(x + size, y + size); ctx.stroke()
          ctx.strokeStyle = theme.text; ctx.globalAlpha = .21
          ctx.setLineDash([3, 4]); path(x, y + size, x + size, y); ctx.setLineDash([])
          ctx.save(); ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip()
          let count = 0, sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0
          designs.forEach((design, index) => {
            if ((!ensemble && index !== current) || !(design.mask[row] & (1 << column))) return
            const emphasis = ensemble ? .5 : 1
            samples[index][row][column].forEach((sample) => {
              ctx.strokeStyle = design.color; ctx.fillStyle = design.color; ctx.lineWidth = 1.4
              ctx.globalAlpha = ensemble ? .08 : .45
              path(px(sample.truth), py(sample.estimate - sample.interval), px(sample.truth), py(sample.estimate + sample.interval))
              ctx.globalAlpha = emphasis * .7
              ctx.beginPath(); ctx.arc(px(sample.truth), py(sample.estimate), width < 540 ? 2 : 2.4, 0, Math.PI * 2); ctx.fill()
              count++; sumX += sample.truth; sumY += sample.estimate
              sumXX += sample.truth ** 2; sumYY += sample.estimate ** 2; sumXY += sample.truth * sample.estimate
            })
          })
          ctx.restore()
          const denominator = Math.sqrt((count * sumXX - sumX ** 2) * (count * sumYY - sumY ** 2))
          if (count > 1 && denominator > 0) label(`r = ${((count * sumXY - sumX * sumY) / denominator).toFixed(2)}`, x + 5, y + 12, 9, 'left', true)
          for (const value of [-1, 0, 1]) {
            label(String(value), px(value), y + size + 13)
            label(String(value), x - 6, py(value) + 3, 8, 'right')
          }
          if (row === 3) label('ground truth', x + size / 2, y + size + 28)
        })
      })
      ctx.globalAlpha = 1
    }
    return animateCanvas({ element: canvas, render, resize, readColors, controls: controlsRef.current, paused: pausedRef.current, offset: clockRef.current, reducedTime: STEP * 12, fps: 30 })
  }, [])

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '.75rem', color: 'text.secondary' }}>{active === -1 ? 'All 12 designs / illustrative recovery' : `${designs[active].name} / illustrative recovery`}</Typography>
        <Button size="small" startIcon={paused ? <PlayArrowRounded /> : <PauseRounded />} onClick={() => setPlayback(!paused)}>{paused ? 'Play' : 'Pause'}</Button>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '104px minmax(0, 1fr)', sm: '144px minmax(0, 1fr)' }, height: 'clamp(440px, 60svh, 580px)', gap: { xs: 1, sm: 2 }, alignItems: 'stretch' }}>
        <Box role="group" aria-label="Select an illustrative design" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(6, minmax(0, 1fr))', height: '100%', gap: .5 }}>
          {designs.map((design, index) => (
            <Button key={design.name} aria-label={`Show mock recovery for ${design.name}`} aria-pressed={active === index} onClick={() => choose(index)} sx={{ display: 'block', minWidth: 0, p: .25, border: '1px solid', borderColor: active === index ? design.color : 'transparent', bgcolor: active === index ? 'surface.raised' : 'transparent', color: 'text.secondary', borderRadius: 0 }}>
              <Box component="svg" viewBox="0 0 80 40" aria-hidden="true" sx={{ display: 'block', width: '100%', maxWidth: 64, mx: 'auto' }}>
                {design.mask.flatMap((mask, row) => parameters.map((_, column) => <rect key={`${row}-${column}`} x={column * 10} y={row * 10} width="9" height="9" fill={mask & (1 << column) ? design.color : 'var(--mui-palette-divider)'} opacity={active === index ? 1 : .55} />))}
              </Box>
              <Typography component="span" sx={{ display: 'block', mt: .75, fontFamily: 'var(--font-mono)', fontSize: { xs: '.5rem', sm: '.6rem' }, whiteSpace: 'nowrap' }}>{design.name}</Typography>
            </Button>
          ))}
        </Box>
        <Box sx={{ minWidth: 0, height: '100%' }}>
          <Box role="region" aria-label="Shared recovery grid" tabIndex={0} sx={{ overflowX: 'auto', height: '100%', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            <Box component="canvas" ref={canvasRef} role="img" aria-label="Illustrative ensemble recovery: eight parameter columns (v, a, z, tau, s-v, s-tau, v-diff, and v-theta) and four effect rows. Twelve colored designs add mock posterior means and intervals against ground truth to the same grid. Dashed diagonals indicate perfect recovery. These are synthetic examples, not measured CogFormer results." sx={{ display: 'block', width: '100%', minWidth: 640, height: '100%' }} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
