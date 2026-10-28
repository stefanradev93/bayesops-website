'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import PauseRounded from '@mui/icons-material/PauseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import ReplayRounded from '@mui/icons-material/ReplayRounded'
import { line, pointer, scaleLinear, select } from 'd3'
import { animateCanvas } from '@/lib/canvasAnimation'
import { chartSx, clamp, placeTooltip, smoothstep, tooltipSx } from '@/lib/demoChart'
import { calibrationDifference, calibrationEnvelope, calibrationLimit } from '@/lib/researchModels'
import { useBayesFlowDemo } from './BayesFlowDemoContext'

const CYCLE = 18000
const GROWTH = 12500
const FIRST = 8
const envelopeGrid = Array.from({ length: 65 }, (_, index) => index / 64)

const signed = (value) => value === 0 ? '0' : (value > 0 ? '+' : '−') + Math.abs(value).toFixed(2).replace(/^0/, '')

// Pearson correlation between true parameters and posterior means.
function correlation(samples) {
  const count = samples.length
  if (count < 2) return 0
  const meanTruth = samples.reduce((sum, { truth }) => sum + truth, 0) / count
  const meanEstimate = samples.reduce((sum, { estimate }) => sum + estimate, 0) / count
  let covariance = 0, truthSpread = 0, estimateSpread = 0
  for (const { truth, estimate } of samples) {
    covariance += (truth - meanTruth) * (estimate - meanEstimate)
    truthSpread += (truth - meanTruth) ** 2
    estimateSpread += (estimate - meanEstimate) ** 2
  }
  return covariance / Math.sqrt(truthSpread * estimateSpread) || 0
}

/** Playback of posterior samples from the trained Lotka–Volterra network. */
export default function BayesFlowDiagnostics() {
  const { demo, example, revealed } = useBayesFlowDemo()
  const hostRef = useRef(null)
  const tooltipRef = useRef(null)
  const countRef = useRef(null)
  const rangeRef = useRef(null)
  const controlsRef = useRef({})
  const clockRef = useRef(0)
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const id = useId().replace(/:/g, '')
  const total = demo.validation.datasets

  const setPlayback = (value) => { pausedRef.current = value; setPaused(value); controlsRef.current.setPaused?.(value) }

  // Seek playback to the moment a given number of datasets is on screen.
  const showCount = (count) => {
    const target = (count - FIRST) / (total - FIRST)
    let low = 0, high = 1
    for (let step = 0; step < 24; step += 1) {
      const middle = (low + high) / 2
      if (smoothstep(middle) < target) low = middle
      else high = middle
    }
    setPlayback(true)
    controlsRef.current.seek?.(high * GROWTH)
  }

  useEffect(() => {
    const host = hostRef.current
    const tooltip = select(tooltipRef.current)
    const controls = controlsRef.current
    let width = 0, count = FIRST, hovered = null, probe = null

    const svg = select(host).append('svg').attr('aria-hidden', 'true')
    const defs = svg.append('defs')
    const panels = demo.diagnostics.map((samples, parameter) => {
      const { symbol, domain } = demo.parameters[parameter]
      const group = svg.append('g')
      const recoveryClip = defs.append('clipPath').attr('id', `${id}-recovery-${parameter}`).append('rect')
      const calibrationClip = defs.append('clipPath').attr('id', `${id}-calibration-${parameter}`).append('rect')
      const recovery = group.append('g').attr('clip-path', `url(#${id}-recovery-${parameter})`)
      const calibration = group.append('g').attr('clip-path', `url(#${id}-calibration-${parameter})`)
      const ticks = [domain[0], (domain[0] + domain[1]) / 2, domain[1]]
      const text = (content, size, anchor = 'start') => group.append('text').attr('font-size', size).attr('text-anchor', anchor).text(content)
      return {
        samples, symbol, domain, ticks,
        x: scaleLinear().domain(domain),
        y: scaleLinear().domain(domain),
        rank: scaleLinear().domain([0, 1]),
        difference: scaleLinear(),
        title: text(symbol, 15, 'middle').attr('class', 'strong'),
        recoveryLabel: text('RECOVERY', 9),
        calibrationLabel: text('CALIBRATION', 9),
        recoveryClip, calibrationClip,
        recoveryAxis: group.append('path').attr('class', 'axis'),
        diagonal: recovery.append('path').attr('class', 'guide').attr('stroke-dasharray', '3 4').attr('stroke-opacity', .35),
        intervals: recovery.append('g').selectAll('line').data(samples).join('line').style('stroke', 'var(--mui-palette-primary-main)').attr('stroke-width', 1.4),
        points: recovery.append('g').selectAll('circle').data(samples).join('circle').style('fill', 'var(--mui-palette-primary-main)'),
        selectedInterval: recovery.append('line').style('stroke', 'var(--mui-palette-secondary-main)').attr('stroke-width', 1.7).attr('stroke-opacity', .8).attr('display', revealed ? null : 'none'),
        selectedPoint: recovery.append('circle').attr('r', 3.5).style('fill', 'var(--mui-palette-secondary-main)').attr('display', revealed ? null : 'none'),
        focusInterval: recovery.append('line').style('stroke', 'var(--mui-palette-text-primary)').attr('stroke-width', 1.4).attr('display', 'none'),
        focusRing: recovery.append('circle').attr('r', 4.5).attr('fill', 'none').style('stroke', 'var(--mui-palette-text-primary)').attr('stroke-width', 1.4).attr('display', 'none'),
        correlation: text('', 9).attr('class', 'strong'),
        recoveryXTicks: group.append('g').selectAll('text').data(ticks).join('text').attr('font-size', 8).attr('text-anchor', 'middle').text(String),
        recoveryYTicks: group.append('g').selectAll('text').data(ticks).join('text').attr('font-size', 8).attr('text-anchor', 'end').text(String),
        truthLabel: text('ground truth', 8, 'middle'),
        meanLabel: text('posterior mean', 8, 'middle'),
        band: calibration.append('path').style('fill', 'var(--mui-palette-primary-main)'),
        zero: calibration.append('line').attr('class', 'guide').attr('stroke-dasharray', '3 3').attr('stroke-opacity', .5),
        curve: calibration.append('path').attr('fill', 'none').style('stroke', 'var(--mui-palette-primary-main)').attr('stroke-width', 1.4),
        focusRank: calibration.append('line').attr('class', 'guide').attr('stroke-dasharray', '2 3').attr('display', 'none'),
        calibrationAxis: group.append('path').attr('class', 'axis'),
        rankTicks: group.append('g').selectAll('text').data([0, .5, 1]).join('text').attr('font-size', 8).attr('text-anchor', 'middle').text(String),
        differenceTicks: group.append('g').selectAll('text').data([1, 0, -1]).join('text').attr('font-size', 8).attr('text-anchor', 'end'),
        rankLabel: text('posterior rank', 8, 'middle'),
        recoveryOverlay: group.append('rect').attr('fill', 'transparent'),
        calibrationOverlay: group.append('rect').attr('fill', 'transparent').style('cursor', 'crosshair'),
      }
    })

    const resize = () => {
      width = host.getBoundingClientRect().width
      const columns = width < 540 ? 2 : 4
      const gap = width < 540 ? 18 : 22
      const cellWidth = (width - (columns - 1) * gap) / columns
      const plotSize = cellWidth - 36
      const groupHeight = 2 * plotSize + 164
      host.style.height = `${groupHeight * (4 / columns)}px`
      panels.forEach((panel, parameter) => {
        const left = (parameter % columns) * (cellWidth + gap)
        const top = Math.floor(parameter / columns) * groupHeight
        const plotLeft = left + 30
        const recoveryTop = top + 50
        const calibrationTop = recoveryTop + plotSize + 66
        const [minimum, maximum] = panel.domain
        Object.assign(panel, { plotLeft, plotSize, recoveryTop, calibrationTop })
        panel.x.range([plotLeft, plotLeft + plotSize])
        panel.y.range([recoveryTop + plotSize, recoveryTop])
        panel.rank.range([plotLeft, plotLeft + plotSize])
        panel.difference.range([calibrationTop + plotSize, calibrationTop])
        panel.title.attr('x', left + cellWidth / 2).attr('y', top + 16)
        panel.recoveryLabel.attr('x', plotLeft).attr('y', recoveryTop - 15)
        panel.calibrationLabel.attr('x', plotLeft).attr('y', calibrationTop - 15)
        panel.recoveryClip.attr('x', plotLeft).attr('y', recoveryTop).attr('width', plotSize).attr('height', plotSize)
        panel.calibrationClip.attr('x', plotLeft).attr('y', calibrationTop).attr('width', plotSize).attr('height', plotSize)
        panel.recoveryAxis.attr('d', `M${plotLeft},${recoveryTop}V${recoveryTop + plotSize}H${plotLeft + plotSize}`)
        panel.diagonal.attr('d', `M${panel.x(minimum)},${panel.y(minimum)}L${panel.x(maximum)},${panel.y(maximum)}`)
        panel.intervals.attr('x1', ({ truth }) => panel.x(truth)).attr('x2', ({ truth }) => panel.x(truth)).attr('y1', ({ lower }) => panel.y(lower)).attr('y2', ({ upper }) => panel.y(upper))
        panel.points.attr('cx', ({ truth }) => panel.x(truth)).attr('cy', ({ estimate }) => panel.y(estimate)).attr('r', width < 540 ? 2 : 2.4)
        const truth = example.truth[parameter]
        panel.selectedInterval.attr('x1', panel.x(truth)).attr('x2', panel.x(truth)).attr('y1', panel.y(example.inference.lower[parameter])).attr('y2', panel.y(example.inference.upper[parameter]))
        panel.selectedPoint.attr('cx', panel.x(truth)).attr('cy', panel.y(example.inference.mean[parameter]))
        panel.correlation.attr('x', plotLeft + 6).attr('y', recoveryTop + 12)
        panel.recoveryXTicks.attr('x', (tick) => panel.x(tick)).attr('y', recoveryTop + plotSize + 13)
        panel.recoveryYTicks.attr('x', plotLeft - 6).attr('y', (tick) => panel.y(tick) + 3)
        panel.truthLabel.attr('x', plotLeft + plotSize / 2).attr('y', recoveryTop + plotSize + 28)
        panel.meanLabel.attr('transform', `translate(${left + 4},${recoveryTop + plotSize / 2}) rotate(-90)`)
        panel.zero.attr('x1', plotLeft).attr('x2', plotLeft + plotSize).attr('y1', calibrationTop + plotSize / 2).attr('y2', calibrationTop + plotSize / 2)
        panel.focusRank.attr('y1', calibrationTop).attr('y2', calibrationTop + plotSize)
        panel.calibrationAxis.attr('d', `M${plotLeft},${calibrationTop}V${calibrationTop + plotSize}H${plotLeft + plotSize}`)
        panel.rankTicks.attr('x', (tick) => panel.rank(tick)).attr('y', calibrationTop + plotSize + 13)
        panel.differenceTicks.attr('x', plotLeft - 5).attr('y', (_, index) => calibrationTop + index * plotSize / 2 + 3)
        panel.rankLabel.attr('x', plotLeft + plotSize / 2).attr('y', calibrationTop + plotSize + 28)
        panel.recoveryOverlay.attr('x', plotLeft).attr('y', recoveryTop).attr('width', plotSize).attr('height', plotSize)
        panel.calibrationOverlay.attr('x', plotLeft).attr('y', calibrationTop).attr('width', plotSize).attr('height', plotSize)
      })
    }

    const render = (time) => {
      clockRef.current = time
      const phase = time % CYCLE
      count = FIRST + (total - FIRST) * smoothstep(phase / GROWTH)
      const opacity = 1 - smoothstep((phase - 17000) / 1000)
      const shown = Math.floor(count)
      countRef.current.textContent = String(shown).padStart(3, '0')
      if (document.activeElement !== rangeRef.current) rangeRef.current.value = String(shown)
      const curves = panels.map(({ samples }) => calibrationDifference(samples, count))
      const limit = Math.max(.1, ...curves.map((curve) => calibrationLimit(curve, count)))
      const focus = hovered !== null && hovered < count ? hovered : null
      panels.forEach((panel, parameter) => {
        const visibility = (index) => smoothstep(count - index) * opacity
        const dim = (index) => focus === null || focus === index ? 1 : .35
        panel.points.attr('opacity', (_, index) => visibility(index) * .7 * dim(index))
        panel.intervals.attr('stroke-opacity', (_, index) => visibility(index) * .16 * dim(index))
        panel.correlation.text(`r = ${correlation(panel.samples.slice(0, Math.max(2, shown))).toFixed(3)}`).attr('opacity', opacity)
        panel.difference.domain([-limit, limit])
        const { rank, difference } = panel
        panel.band.attr('fill-opacity', opacity * .09).attr('d', line().x((p) => rank(p)).y((p) => difference(calibrationEnvelope(p, count)))(envelopeGrid)
          + line().x((p) => rank(p)).y((p) => difference(-calibrationEnvelope(p, count)))(envelopeGrid.toReversed()).replace('M', 'L') + 'Z')
        panel.curve.attr('stroke-opacity', opacity).attr('d', line().x(({ x }) => rank(x)).y(({ y }) => difference(y))(curves[parameter]))
        panel.differenceTicks.text((sign) => signed(sign * limit))
        if (focus === null) {
          panel.focusRing.attr('display', 'none')
          panel.focusInterval.attr('display', 'none')
          const probed = probe?.panel === panel
          panel.focusRank.attr('display', probed ? null : 'none')
          if (probed) panel.focusRank.attr('x1', rank(probe.rank)).attr('x2', rank(probe.rank))
          return
        }
        const sample = panel.samples[focus]
        panel.focusRing.attr('display', null).attr('cx', panel.x(sample.truth)).attr('cy', panel.y(sample.estimate))
        panel.focusInterval.attr('display', null).attr('x1', panel.x(sample.truth)).attr('x2', panel.x(sample.truth)).attr('y1', panel.y(sample.lower)).attr('y2', panel.y(sample.upper))
        panel.focusRank.attr('display', null).attr('x1', rank(sample.rank)).attr('x2', rank(sample.rank))
      })
    }

    const redraw = () => { if (pausedRef.current) controls.refresh() }
    const hide = () => tooltip.style('opacity', 0)
    // Hovering a validation dataset highlights it in every parameter's plots.
    panels.forEach((panel) => {
      panel.recoveryOverlay
        .on('pointermove', (event) => {
          const [px, py] = pointer(event, svg.node())
          let nearest = null, distance = 14 ** 2
          panel.samples.forEach(({ truth, estimate }, index) => {
            if (index >= count) return
            const gap = (panel.x(truth) - px) ** 2 + (panel.y(estimate) - py) ** 2
            if (gap < distance) { distance = gap; nearest = index }
          })
          hovered = nearest
          if (nearest === null) hide()
          else {
            const { truth, estimate, lower, upper } = panel.samples[nearest]
            placeTooltip(tooltip, { x: panel.x(truth), y: panel.y(estimate), width, html: `Dataset ${nearest + 1} · ${panel.symbol}<br>true ${truth.toFixed(2)} · mean ${estimate.toFixed(2)}<br>90% [${lower.toFixed(2)}, ${upper.toFixed(2)}]` })
          }
          redraw()
        })
        .on('pointerleave', () => { hovered = null; hide(); redraw() })
      panel.calibrationOverlay
        .on('pointermove', (event) => {
          const [px] = pointer(event, svg.node())
          const rank = clamp(panel.rank.invert(px), 0, 1)
          const curve = calibrationDifference(panel.samples, count)
          const value = curve.findLast(({ x }) => x <= rank)?.y ?? 0
          probe = { panel, rank }
          placeTooltip(tooltip, { x: panel.rank(rank), y: panel.difference(value), width, html: `rank ${rank.toFixed(2)}<br>ECDF − uniform ${signed(value)}<br>95% envelope ±${calibrationEnvelope(rank, count).toFixed(2).replace(/^0/, '')}` })
          redraw()
        })
        .on('pointerleave', () => { probe = null; hide(); redraw() })
    })

    const stop = animateCanvas({ element: host, render, resize, paused: pausedRef.current, offset: clockRef.current, reducedTime: 14000, controls })
    return () => { stop(); svg.remove() }
  }, [demo, example, revealed, total, id])

  return (
    <Box data-bayesflow-diagnostics>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: '1 1 260px', fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'text.secondary' }}>
          <Box component="span" sx={{ whiteSpace: 'nowrap' }}><Box component="span" ref={countRef} sx={{ color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}>008</Box> / {total} datasets</Box>
          <Box component="input" ref={rangeRef} type="range" min={FIRST} max={total} step={1} defaultValue={FIRST} onInput={(event) => showCount(Number(event.target.value))} aria-label="Validation datasets shown" sx={{ flex: 1, minWidth: 0, maxWidth: 280, accentColor: 'var(--mui-palette-primary-main)', cursor: 'pointer' }} />
        </Box>
        <Stack direction="row" spacing={.5} sx={{ '@media (prefers-reduced-motion: reduce)': { display: 'none' } }}>
          <Button size="small" color="inherit" startIcon={paused ? <PlayArrowRounded /> : <PauseRounded />} onClick={() => setPlayback(!paused)} aria-label={paused ? 'Resume diagnostics animation' : 'Pause diagnostics animation'} sx={{ fontSize: '.7rem', color: 'text.secondary' }}>{paused ? 'Resume' : 'Pause'}</Button>
          <Button size="small" color="inherit" startIcon={<ReplayRounded />} onClick={() => { controlsRef.current.seek?.(0); setPlayback(false) }} aria-label="Replay diagnostics animation" sx={{ fontSize: '.7rem', color: 'text.secondary' }}>Replay</Button>
        </Stack>
      </Stack>
      <Box role="group" aria-label={`Eight square diagnostic plots for the four Lotka–Volterra rates: parameter recovery with 90% posterior intervals and the correlation between true and estimated values across ${total} held-out simulated datasets, and calibration ECDF differences from uniform with approximate pointwise 95% envelopes. All results come from the trained BayesFlow network.${revealed ? ' Larger recovery markers show the selected ecosystem.' : ''}`} sx={{ position: 'relative', width: '100%' }}>
        <Box ref={hostRef} sx={{ ...chartSx, position: 'relative', width: '100%', height: { xs: 800, sm: 500 } }} />
        <Box ref={tooltipRef} aria-hidden="true" sx={tooltipSx} />
      </Box>
      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mt: 2, fontSize: '.7rem', color: 'text.secondary' }}>
        <Box component="span"><Box component="span" sx={{ display: 'inline-block', width: 14, borderTop: '2px solid', borderColor: 'primary.main', mr: .75, verticalAlign: 'middle' }} />Posterior mean + 90% interval</Box>
        <Box component="span"><Box component="span" sx={{ display: 'inline-block', width: 14, height: 8, bgcolor: 'primary.main', opacity: .15, mr: .75, verticalAlign: 'middle' }} />95% pointwise calibration envelope</Box>
        {revealed && <Box component="span"><Box component="span" sx={{ color: 'secondary.main', mr: .75 }}>●</Box>Selected ecosystem</Box>}
        <Box component="span" sx={{ ml: 'auto' }}>Hover a point to trace one dataset across all four rates</Box>
      </Stack>
      <Typography sx={{ mt: 2, fontFamily: 'var(--font-mono)', fontSize: '.65rem', color: 'text.secondary' }}>{demo.model.trainingExamples.toLocaleString('en-US')} training simulations · {demo.validation.posteriorDraws} posterior draws per validation dataset</Typography>
    </Box>
  )
}
