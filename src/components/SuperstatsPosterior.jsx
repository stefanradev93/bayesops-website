'use client'

import { useEffect, useId, useState } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Slider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import PauseRounded from '@mui/icons-material/PauseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import { TextLink } from './links'

const primary = 'var(--mui-palette-primary-main)'
const secondary = 'var(--mui-palette-secondary-main)'
const neutral = 'var(--mui-palette-text-secondary)'
const divider = 'var(--mui-palette-divider)'
const W = 720, H = 300
const left = 48, right = W - 16, top = 20, bottom = H - 38
const x = (index, count) => left + index / (count - 1) * (right - left)
const path = (values, y) => values.map((value, index) => `${index ? 'L' : 'M'}${x(index, values.length).toFixed(2)},${y(value).toFixed(2)}`).join(' ')
const svgSx = { display: 'block', width: '100%', height: 'auto', overflow: 'visible', '& text': { fill: neutral, fontFamily: 'var(--font-mono), monospace', fontSize: 11 } }

function Legend({ color, children, band, dashed }) {
  return <Box component="span" sx={{ display: 'inline-flex', gap: 1, alignItems: 'center', fontSize: '.75rem', color: 'text.secondary' }}><Box component="span" sx={{ width: 18, height: band ? 10 : 0, bgcolor: band ? color : 'transparent', opacity: band ? .2 : 1, borderTop: band ? 0 : `2px ${dashed ? 'dashed' : 'solid'} ${color}` }} />{children}</Box>
}

export default function SuperstatsPosterior({ demo, caption }) {
  const id = useId()
  const [parameterKey, setParameterKey] = useState('v')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [trial, setTrial] = useState(49)
  const [showTruth, setShowTruth] = useState(true)
  const [playing, setPlaying] = useState(false)
  const example = demo.examples[exampleIndex]
  const parameter = demo.parameters.find(({ key }) => key === parameterKey)
  const posterior = example.parameters[parameterKey]
  const count = posterior.median.length

  useEffect(() => {
    if (!playing) return
    // Playback visits saved trial-wise marginals; the conditioning dataset stays fixed.
    const timer = window.setInterval(() => setTrial((value) => (value + 1) % count), 200)
    return () => window.clearInterval(timer)
  }, [playing, count])

  useEffect(() => {
    const stop = () => { if (document.hidden) setPlaying(false) }
    document.addEventListener('visibilitychange', stop)
    return () => document.removeEventListener('visibilitychange', stop)
  }, [])

  // Keep each parameter's axes fixed when switching between recorded datasets.
  const minimum = Math.min(...demo.examples.map(({ parameters }) => parameters[parameterKey].densityGrid[0]))
  const maximum = Math.max(...demo.examples.map(({ parameters }) => parameters[parameterKey].densityGrid.at(-1)))
  const y = (value) => bottom - (value - minimum) / (maximum - minimum) * (bottom - top)
  const interval = `${path(posterior.upper, y)} ${[...posterior.lower].reverse().map((value, index) => `L${x(count - 1 - index, count)},${y(value)}`).join(' ')} Z`
  const ticks = [minimum, (minimum + maximum) / 2, maximum]
  const timeTicks = [0, 24, 49, 74, 99]
  const densityX = (value) => 36 + (value - minimum) / (maximum - minimum) * 288
  const maximumDensity = Math.max(...posterior.density.map((values) => Math.max(...values)))
  const densityY = (value) => 185 - value / maximumDensity * 140
  const densityPath = posterior.density[trial].map((value, index) => `${index ? 'L' : 'M'}${densityX(posterior.densityGrid[index])},${densityY(value)}`).join(' ')
  const densityArea = `${densityPath}L${densityX(posterior.densityGrid.at(-1))},185L${densityX(posterior.densityGrid[0])},185Z`
  const rtMaximum = Math.max(...example.responseTime)
  const rtLimit = Math.ceil(rtMaximum * 2) / 2
  const rtY = (value) => 70 - value / rtLimit * 40
  const selectTrial = (value) => { setTrial(value); setPlaying(false) }
  const selectTime = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = (event.clientX - bounds.left) / bounds.width * W
    selectTrial(Math.max(0, Math.min(count - 1, Math.round((position - left) / (right - left) * (count - 1)))))
  }
  const pointerSx = { ...svgSx, cursor: 'crosshair', touchAction: 'pan-y', '& text': { ...svgSx['& text'], fontSize: { xs: 20, sm: 14, md: 11 } } }
  const dragTime = (event) => { if (event.buttons === 1) selectTime(event) }

  return (
    <Box component="figure" sx={{ m: 0, minWidth: 0 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 3, alignItems: { md: 'center' }, justifyContent: 'space-between', mb: 4 }}>
        <ToggleButtonGroup value={parameterKey} exclusive onChange={(_, value) => { if (value) setParameterKey(value) }} size="small" aria-label="Time-varying DDM parameter">
          {demo.parameters.map(({ key, label }) => <ToggleButton key={key} value={key}>{label}</ToggleButton>)}
        </ToggleButtonGroup>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
          <Typography component="span" sx={{ color: 'text.secondary', fontSize: '.8rem' }}>Sequence</Typography>
          <ToggleButtonGroup value={exampleIndex} exclusive onChange={(_, value) => { if (value !== null) { setExampleIndex(value); setPlaying(false) } }} size="small" aria-label="Recorded dataset">
            {demo.examples.map(({ label }, index) => <ToggleButton key={label} value={index} aria-label={label}>{index + 1}</ToggleButton>)}
          </ToggleButtonGroup>
        </Stack>
      </Stack>
      <Typography sx={{ mb: 3, color: 'text.secondary', fontSize: '.85rem', maxWidth: 700 }}>{parameter.description} Both parameters vary across the 100 trials in each recorded sequence.</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2.2fr) minmax(0, 1fr)' }, gap: { xs: 4, lg: 5 }, alignItems: 'start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '.75rem', mb: 1 }}>{parameter.label} · {parameter.symbol}ₜ</Typography>
          <Box component="svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${parameter.label}: Superstats posterior median and pointwise 95% credible interval over 100 trials. Use the trial slider below to inspect a posterior.`} onPointerDown={selectTime} onPointerMove={dragTime} sx={pointerSx}>
            <defs><clipPath id={`${id}-trajectory`}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath></defs>
            {ticks.map((value) => <g key={value}><path d={`M${left},${y(value)}H${right}`} stroke={divider} /><text x={left - 8} y={y(value) + 4} textAnchor="end">{value.toFixed(1)}</text></g>)}
            <g clipPath={`url(#${id}-trajectory)`}>
              <path d={interval} fill={primary} fillOpacity=".16" />
              {showTruth && <path d={path(posterior.truth, y)} fill="none" stroke={secondary} strokeWidth="1.8" strokeDasharray="5 4" />}
              <path d={path(posterior.median, y)} fill="none" stroke={primary} strokeWidth="2.5" />
              <path d={`M${x(trial, count)},${top}V${bottom}`} stroke={neutral} strokeDasharray="3 4" />
              <path d={`M${x(trial, count)},${y(posterior.lower[trial])}V${y(posterior.upper[trial])}`} stroke={primary} strokeWidth="4" />
              <circle cx={x(trial, count)} cy={y(posterior.median[trial])} r="5" fill={primary} stroke="var(--mui-palette-surface-raised)" strokeWidth="2" />
            </g>
            {timeTicks.map((index) => <text key={index} x={x(index, count)} y={bottom + 22} textAnchor="middle">{index + 1}</text>)}
          </Box>
          <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mt: 1, mb: 4 }}>
            <Legend color={primary}>Posterior median</Legend><Legend color={primary} band>95% interval</Legend>{showTruth && <Legend color={secondary} dashed>Simulated truth</Legend>}
          </Stack>
          <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '.75rem', mb: 1 }}>{example.label} · response times by choice (s)</Typography>
          <Box component="svg" viewBox="0 0 720 150" role="img" aria-label="The observed DDM response times. Upper-boundary choices appear above zero; lower-boundary choices appear below zero." onPointerDown={selectTime} onPointerMove={dragTime} sx={pointerSx}>
            <path d={`M${left},70H${right}`} stroke={divider} />
            {[rtLimit, 0, -rtLimit].map((value) => <text key={value} x={left - 8} y={rtY(value) + 4} textAnchor="end">{value.toFixed(1)}</text>)}
            {example.responseTime.map((value, index) => <circle key={index} cx={x(index, count)} cy={rtY(example.choice[index] === 1 ? value : -value)} r={index === trial ? 4.5 : 2.5} fill={example.choice[index] === 1 ? primary : secondary} opacity={index === trial ? 1 : .6} />)}
            <path d={`M${x(trial, count)},20V115`} stroke={neutral} strokeDasharray="3 4" />
            {timeTicks.map((index) => <text key={index} x={x(index, count)} y="135" textAnchor="middle">{index + 1}</text>)}
            <text x={right} y="150" textAnchor="end">trial →</text>
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '.75rem' }}>Posterior at trial {trial + 1}</Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: '.85rem' }}>p({parameter.symbol}ₜ | response times, choices)</Typography>
          <Box component="svg" viewBox="0 0 360 225" role="img" aria-label={`Superstats ${parameter.label} posterior at trial ${trial + 1}: median ${posterior.median[trial].toFixed(2)}, 95% credible interval ${posterior.lower[trial].toFixed(2)} to ${posterior.upper[trial].toFixed(2)}.`} sx={svgSx}>
            <defs><clipPath id={`${id}-interval`}><rect x={densityX(posterior.lower[trial])} y="20" width={densityX(posterior.upper[trial]) - densityX(posterior.lower[trial])} height="165" /></clipPath></defs>
            <path d="M36,185H324" stroke={divider} />
            <path d={densityArea} fill={primary} fillOpacity=".16" clipPath={`url(#${id}-interval)`} />
            <path d={densityPath} fill="none" stroke={primary} strokeWidth="2.5" />
            {showTruth && <path d={`M${densityX(posterior.truth[trial])},185v-145`} stroke={secondary} strokeDasharray="5 4" strokeWidth="1.5" />}
            {ticks.map((value) => <text key={value} x={densityX(value)} y="208" textAnchor="middle">{value.toFixed(1)}</text>)}
            <text x="324" y="225" textAnchor="end">{parameter.symbol}ₜ</text>
          </Box>
          <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', fontVariantNumeric: 'tabular-nums' }}>Median {posterior.median[trial].toFixed(2)}</Typography>
          <Typography color="text.secondary" sx={{ mt: .75, fontSize: '.8rem', fontVariantNumeric: 'tabular-nums' }}>95% interval [{posterior.lower[trial].toFixed(2)}, {posterior.upper[trial].toFixed(2)}]</Typography>
          <Typography color="text.secondary" sx={{ mt: 3, fontSize: '.8rem', lineHeight: 1.7 }}>Each trial’s posterior uses the whole sequence. Move through time to inspect how the estimated parameter and its uncertainty vary.</Typography>
          <Typography color="text.secondary" sx={{ mt: 2, fontSize: '.75rem' }}>{demo.provenance.draws} neural posterior samples per trial.</Typography>
        </Box>
      </Box>
      <Stack direction="row" sx={{ gap: 3, mt: 4, alignItems: 'center' }}>
        <Button onClick={() => setPlaying((value) => !value)} startIcon={playing ? <PauseRounded /> : <PlayArrowRounded />} sx={{ flexShrink: 0 }}>{playing ? 'Pause' : 'Play'}</Button>
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography id={`${id}-time`} sx={{ fontSize: '.8rem' }}>Inspect trial · {trial + 1}</Typography><Slider aria-labelledby={`${id}-time`} min={0} max={count - 1} value={trial} onChange={(_, value) => selectTrial(value)} getAriaValueText={(value) => `Trial ${value + 1}`} /></Box>
      </Stack>
      <FormControlLabel control={<Checkbox checked={showTruth} onChange={(_, value) => setShowTruth(value)} size="small" />} label="Show simulated truth" sx={{ '& .MuiFormControlLabel-label': { fontSize: '.8rem' } }} />
      <Typography component="figcaption" color="text.secondary" sx={{ mt: 2, maxWidth: 850, fontSize: '.75rem', lineHeight: 1.7 }}>{caption}{' '}<TextLink href={demo.provenance.notebookUrl} sx={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>Superstats example</TextLink>.</Typography>
    </Box>
  )
}
