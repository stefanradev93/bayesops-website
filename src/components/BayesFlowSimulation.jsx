'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import PauseRounded from '@mui/icons-material/PauseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import ReplayRounded from '@mui/icons-material/ReplayRounded'
import { area, line, pointer, range, scaleLinear, select } from 'd3'
import { animateCanvas } from '@/lib/canvasAnimation'
import { chartSx, clamp, placeTooltip, smoothstep, tooltipSx } from '@/lib/demoChart'
import { useBayesFlowDemo } from './BayesFlowDemoContext'
import { TextLink } from './links'

const PLAYBACK = 12500
const LOOP = 16000
const PARTICLES = 100
const species = [
  { name: 'Prey', color: 'var(--mui-palette-primary-main)', radius: 1.7 },
  { name: 'Predators', color: 'var(--mui-palette-secondary-main)', radius: 2.5 },
]

// Linear interpolation of a recorded series at a fractional time index.
const sampleAt = (series, index, column) => {
  const before = Math.floor(index), after = Math.min(series.length - 1, before + 1)
  return series[before][column] + (series[after][column] - series[before][column]) * (index - before)
}

export default function BayesFlowSimulation() {
  const { demo, example, exampleIndex, revealed, selectExample, reveal } = useBayesFlowDemo()
  const hostRef = useRef(null)
  const tooltipRef = useRef(null)
  const valuesRef = useRef([])
  const controlsRef = useRef({})
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const id = useId().replace(/:/g, '')
  const duration = example.time.at(-1)

  const setPlayback = (value) => { pausedRef.current = value; setPaused(value); controlsRef.current.setPaused?.(value) }

  useEffect(() => {
    const host = hostRef.current
    const tooltip = select(tooltipRef.current)
    const controls = controlsRef.current
    const lastIndex = example.time.length - 1
    const maximum = Math.max(...example.populations.flat(), ...example.observations.flat(), ...(revealed ? example.predictive.upper.flat() : [])) * 1.1
    const particleScale = PARTICLES / Math.max(...example.populations.flat())
    const x = scaleLinear().domain([0, duration])
    const y = scaleLinear().domain([0, maximum])
    let width = 0, fieldHeight = 0, plotTop = 0, bottom = 0, current = 0, hoverTime = null, scrubbing = false

    const svg = select(host).append('svg').attr('aria-hidden', 'true')
    const defs = svg.append('defs')
    species.forEach(({ color }, column) => {
      const halo = defs.append('radialGradient').attr('id', `${id}-halo-${column}`)
      for (const [offset, opacity] of [[0, .22], [.3, .07], [1, 0]]) halo.append('stop').attr('offset', offset).style('stop-color', color).style('stop-opacity', opacity)
    })
    const clip = defs.append('clipPath').attr('id', `${id}-plot`).append('rect')

    // Particles depict relative abundance. Their movement is illustrative;
    // the population counts and plotted paths come from the recorded ODE.
    const particles = species.map(({ color, radius }, column) => {
      const group = svg.append('g').selectAll('g').data(range(PARTICLES)).join('g')
      group.append('circle').attr('r', radius * 3.5).attr('fill', `url(#${id}-halo-${column})`).attr('opacity', .8)
      group.append('circle').attr('r', radius).style('fill', color)
      return group
    })
    const clock = svg.append('text').attr('text-anchor', 'end').attr('font-size', 9)
    const axis = svg.append('path').attr('class', 'axis')
    const labels = svg.append('g').attr('font-size', 9)
    const plotLabel = labels.append('text').text('relative population')
    const timeTicks = labels.selectAll(null).data([0, duration / 2, duration]).join('text').attr('text-anchor', 'middle').text(String)
    const timeLabel = labels.append('text').attr('text-anchor', 'end').text('time')
    const zeroTick = labels.append('text').attr('text-anchor', 'end').text('0')
    const topTick = labels.append('text').attr('text-anchor', 'end').text(maximum.toFixed(1))
    const plot = svg.append('g').attr('clip-path', `url(#${id}-plot)`)
    const series = species.map(({ color }) => {
      const group = plot.append('g')
      return {
        band: group.append('path').style('fill', color).attr('fill-opacity', .1).attr('display', revealed ? null : 'none'),
        median: group.append('path').attr('fill', 'none').style('stroke', color).attr('stroke-width', 1.6).attr('stroke-dasharray', '4 3').attr('stroke-opacity', .9).attr('display', revealed ? null : 'none'),
        truth: group.append('path').attr('fill', 'none').style('stroke', color).attr('stroke-width', 1.3).attr('stroke-opacity', revealed ? .4 : .85).attr('stroke-linecap', 'round'),
        observations: group.append('g').selectAll('circle').data(example.observationTimes).join('circle').attr('r', 2).style('fill', color),
      }
    })
    const cursor = svg.append('g').attr('display', 'none')
    const cursorLine = cursor.append('line').attr('class', 'guide').attr('stroke-dasharray', '2 3')
    const cursorDots = species.map(({ color }) => cursor.append('circle').attr('r', 3.5).style('fill', color).style('stroke', 'var(--mui-palette-background-default)').attr('stroke-width', 1.5))
    const overlay = svg.append('rect').attr('fill', 'transparent').style('cursor', 'ew-resize').style('touch-action', 'pan-y')

    const path = (column, values) => line().x((index) => x(example.time[index])).y((index) => y(values[index][column]))
    const band = (column) => area().x((index) => x(example.time[index])).y0((index) => y(example.predictive.lower[index][column])).y1((index) => y(example.predictive.upper[index][column]))

    const drawCursor = () => {
      if (hoverTime === null) { cursor.attr('display', 'none'); tooltip.style('opacity', 0); return }
      const time = Math.min(hoverTime, current)
      const index = time / duration * lastIndex
      const values = species.map((_, column) => sampleAt(example.populations, index, column))
      cursor.attr('display', null)
      cursorLine.attr('x1', x(time)).attr('x2', x(time)).attr('y1', plotTop).attr('y2', bottom)
      cursorDots.forEach((dot, column) => dot.attr('cx', x(time)).attr('cy', y(values[column])))
      const rows = species.map(({ name, color }, column) =>
        `<span style="color:${color}">●</span> ${name} ${values[column].toFixed(2)}${revealed ? ` · fit ${sampleAt(example.predictive.median, index, column).toFixed(2)}` : ''}`)
      placeTooltip(tooltip, { x: x(time), y: plotTop + 24, width, html: `t = ${time.toFixed(1)}<br>${rows.join('<br>')}` })
    }

    const resize = () => {
      const bounds = host.getBoundingClientRect()
      width = bounds.width
      fieldHeight = bounds.height * .54
      const left = 28, right = width - 9
      plotTop = fieldHeight + 28
      bottom = bounds.height - 27
      x.range([left, right])
      y.range([bottom, plotTop])
      clock.attr('x', width - 5).attr('y', 12)
      axis.attr('d', `M${left},${plotTop}V${bottom}H${right}`)
      plotLabel.attr('x', left).attr('y', plotTop - 10)
      timeTicks.attr('x', (time) => x(time)).attr('y', bottom + 16)
      timeLabel.attr('x', right).attr('y', bounds.height - 1)
      zeroTick.attr('x', left - 8).attr('y', bottom + 3)
      topTick.attr('x', left - 8).attr('y', plotTop + 3)
      clip.attr('x', left).attr('y', plotTop).attr('width', right - left).attr('height', bottom - plotTop)
      overlay.attr('x', left).attr('y', plotTop - 12).attr('width', right - left).attr('height', bottom - plotTop + 12)
      series.forEach(({ observations }, column) => observations.attr('cx', (time) => x(time)).attr('cy', (_, index) => y(example.observations[index][column])))
    }

    const render = (time) => {
      const progress = Math.min(1, (time % LOOP) / PLAYBACK)
      const index = progress * lastIndex
      current = progress * duration
      const populations = species.map((_, column) => sampleAt(example.populations, index, column))
      populations.forEach((value, column) => { if (valuesRef.current[column]) valuesRef.current[column].textContent = value.toFixed(2) })
      host.setAttribute('aria-valuenow', current.toFixed(1))
      host.setAttribute('aria-valuetext', `t = ${current.toFixed(1)}`)
      particles.forEach((group, column) => group
        .attr('opacity', (particle) => smoothstep(populations[column] * particleScale - particle) * .78)
        .attr('transform', (particle) => {
          const phase = particle * 2.399963 + column * 4.1 + exampleIndex
          const speed = time / 1000 * (column ? .24 : .15)
          const px = width * (.5 + .39 * Math.sin(phase * 1.7 + speed) + .04 * Math.cos(phase + speed * .7))
          const py = fieldHeight * (.5 + .34 * Math.cos(phase * 2.3 + speed * .8) + .08 * Math.sin(phase * .7 - speed))
          return `translate(${px.toFixed(1)},${py.toFixed(1)})`
        }))
      clock.text(`t = ${current.toFixed(1)}`)
      const shown = range(Math.max(1, Math.ceil(index)) + 1)
      series.forEach((parts, column) => {
        parts.truth.attr('d', path(column, example.populations)(shown))
        if (revealed) {
          parts.band.attr('d', band(column)(shown))
          parts.median.attr('d', path(column, example.predictive.median)(shown))
        }
        parts.observations.attr('opacity', (observed) => observed <= current ? .8 : 0)
      })
      drawCursor()
    }

    // Dragging or arrow keys pause playback and scrub the recorded simulation.
    const seek = (time) => {
      pausedRef.current = true
      setPaused(true)
      controls.setPaused(true)
      controls.seek(clamp(time, 0, duration) / duration * PLAYBACK)
    }
    const timeAt = (event) => clamp(x.invert(pointer(event, svg.node())[0]), 0, duration)
    overlay
      .on('pointerdown', (event) => { scrubbing = true; event.currentTarget.setPointerCapture(event.pointerId); hoverTime = timeAt(event); seek(hoverTime) })
      .on('pointermove', (event) => {
        hoverTime = timeAt(event)
        if (scrubbing) seek(hoverTime)
        else drawCursor()
      })
      .on('pointerup pointercancel', () => { scrubbing = false })
      .on('pointerleave', () => { if (!scrubbing) { hoverTime = null; drawCursor() } })
    const onKey = (event) => {
      const step = { ArrowRight: .5, ArrowUp: .5, ArrowLeft: -.5, ArrowDown: -.5 }[event.key]
      if (step === undefined && event.key !== 'Home' && event.key !== 'End') return
      event.preventDefault()
      seek(event.key === 'Home' ? 0 : event.key === 'End' ? duration : current + step * (event.shiftKey ? 4 : 1))
    }
    host.addEventListener('keydown', onKey)

    const stop = animateCanvas({ element: host, render, resize, reducedTime: PLAYBACK, paused: pausedRef.current, controls })
    return () => { stop(); host.removeEventListener('keydown', onKey); svg.remove() }
  }, [example, exampleIndex, revealed, duration, id])

  return (
    <Box data-bayesflow-simulation>
      <Typography component="p" sx={{ mb: 2, fontFamily: 'var(--font-mono)', fontSize: '.65rem', color: 'text.secondary' }}>Lotka–Volterra predator–prey model</Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'space-between', alignItems: 'center', pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }} aria-label="Ecosystem examples">
          {demo.examples.map((item, index) => <Button key={item.title} size="small" color="inherit" aria-pressed={exampleIndex === index} onClick={() => { selectExample(index); setPlayback(false) }} sx={{ px: .5, fontSize: '.75rem', color: exampleIndex === index ? 'primary.main' : 'text.secondary', borderRadius: 0, borderBottom: '1px solid', borderColor: exampleIndex === index ? 'primary.main' : 'transparent' }}>{item.title}</Button>)}
        </Stack>
        <Stack direction="row" spacing={.5} sx={{ '@media (prefers-reduced-motion: reduce)': { display: 'none' } }}>
          <Button size="small" color="inherit" startIcon={paused ? <PlayArrowRounded /> : <PauseRounded />} onClick={() => setPlayback(!paused)} aria-label={paused ? 'Play ecosystem simulation' : 'Pause ecosystem simulation'} sx={{ fontSize: '.7rem', color: 'text.secondary' }}>{paused ? 'Play' : 'Pause'}</Button>
          <Button size="small" color="inherit" startIcon={<ReplayRounded />} aria-label="Replay ecosystem simulation" onClick={() => { controlsRef.current.seek?.(0); setPlayback(false) }} sx={{ fontSize: '.7rem', color: 'text.secondary' }}>Replay</Button>
        </Stack>
      </Stack>
      <Box role="group" aria-label={`${example.title} ecosystem: prey and predator particles represent relative population abundance. Population trajectories and noisy observations follow a four-parameter Lotka–Volterra simulation.${revealed ? ' Dashed curves and shaded intervals show the trained BayesFlow posterior predictive fit.' : ''}`} sx={{ position: 'relative', width: '100%', height: { xs: 370, sm: 420 } }}>
        <Box
          ref={hostRef}
          role="slider"
          tabIndex={0}
          aria-label="Simulation time"
          aria-valuemin={0}
          aria-valuemax={duration}
          sx={{ ...chartSx, position: 'absolute', inset: 0, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4 } }}
        />
        <Box ref={tooltipRef} aria-hidden="true" sx={tooltipSx} />
      </Box>
      <Stack direction="row" sx={{ gap: 3, mt: 1, flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'text.secondary' }}>
        {species.map(({ name }, index) => <Box key={name} component="span"><Box component="span" sx={{ color: index ? 'secondary.main' : 'primary.main' }}>●</Box> {name} <Box component="span" ref={element => { valuesRef.current[index] = element }} sx={{ fontVariantNumeric: 'tabular-nums' }}>{demo.simulation.initial[index].toFixed(2)}</Box></Box>)}
        <Box component="span" sx={{ ml: 'auto' }}>Drag the chart to scrub through time</Box>
      </Stack>
      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
        {demo.parameters.map((parameter, index) => <Box key={parameter.key}>
          <Typography sx={{ fontSize: '.68rem', color: 'text.secondary' }}>{parameter.label}</Typography>
          <Typography sx={{ mt: .5, fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}>{parameter.symbol} = {example.truth[index].toFixed(2)}</Typography>
          {revealed && <Box sx={{ mt: 1 }}><Typography sx={{ color: 'primary.main', fontSize: '.78rem' }}>Inferred {example.inference.mean[index].toFixed(2)}</Typography><Typography sx={{ fontSize: '.65rem', color: 'text.secondary' }}>[{example.inference.lower[index].toFixed(2)}, {example.inference.upper[index].toFixed(2)}]</Typography></Box>}
        </Box>)}
      </Box>
      <Stack direction="row" sx={{ mt: 3, gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {revealed
          ? <TextLink href="#bayesflow-diagnostics" sx={{ color: 'primary.main', fontSize: '.8rem', textDecoration: 'underline', textUnderlineOffset: 3 }}>How well does it recover parameters?</TextLink>
          : <Button variant="outlined" size="small" onClick={reveal}>Infer the parameters</Button>}
      </Stack>
      <Typography role="status" sx={{ mt: 2, fontSize: '.7rem', color: 'text.secondary', lineHeight: 1.7 }}>
        {revealed ? 'Estimates with 90% posterior intervals. Shaded bands: 90% posterior predictive trajectories.' : 'Dots are noisy observations; the network sees only these.'}
      </Typography>
    </Box>
  )
}
