'use client'

import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'

// Three equally spaced points on the circular track: 0°, 120°, and 240°.
const backends = [
  { name: 'PyTorch', file: 'pytorch.svg', color: '#EE4C2C', background: '#FDE725', left: '25%', top: '6.69873%' },
  { name: 'JAX', file: 'jax.svg', background: '#440154', left: '25%', top: '93.30127%' },
  { name: 'TensorFlow', file: 'tensorflow.svg', background: '#21918C', left: '100%', top: '50%' },
]

export default function BayesFlowBackendOrbit() {
  const hostRef = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    let visible = false
    const refresh = () => setActive(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh() })
    observer.observe(hostRef.current)
    document.addEventListener('visibilitychange', refresh)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', refresh) }
  }, [])

  return (
    <Box ref={hostRef} data-backend-orbit>
      <Box
        role="img"
        aria-label="BayesFlow at the center of an orbit of PyTorch, JAX, and TensorFlow: three backends supported through Keras 3."
        sx={{
          position: 'relative', width: '100%', maxWidth: 600, aspectRatio: '1', mx: 'auto', overflow: 'clip',
          '@keyframes bayesflow-orbit': { to: { transform: 'rotate(360deg)' } },
          '@keyframes bayesflow-counter-orbit': { to: { transform: 'rotate(-360deg)' } },
          '& .orbit-track, & .orbit-logo': { animationDuration: '36s', animationTimingFunction: 'linear', animationIterationCount: 'infinite', animationPlayState: active ? 'running' : 'paused' },
          '@media (prefers-reduced-motion: reduce)': { '& .orbit-track, & .orbit-logo': { animation: 'none' } },
        }}
      >
        <Box className="orbit-track" sx={{ position: 'absolute', inset: '10%', borderRadius: '50%', animationName: 'bayesflow-orbit' }}>
          <Box sx={{
            position: 'absolute', inset: 0, borderRadius: '50%', padding: '3%',
            background: 'conic-gradient(from -45deg, #FDE725, #5DC963 20%, #21918C 40%, #3B528B 60%, #440154 75%, #21918C 88%, #FDE725)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude', WebkitMaskComposite: 'xor',
          }} />
          {backends.map((backend) => (
            <Box key={backend.name} sx={{ position: 'absolute', left: backend.left, top: backend.top, width: '25%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }}>
              <Box className="orbit-logo" sx={{ animationName: 'bayesflow-counter-orbit', display: 'grid', placeItems: 'center', width: '100%', height: '100%', borderRadius: '50%', bgcolor: backend.background }}>
                {backend.color ? (
                  <Box sx={{ width: '56%', height: '60%', bgcolor: backend.color, mask: `url(/images/products/bayesflow/${backend.file}) center / contain no-repeat`, WebkitMask: `url(/images/products/bayesflow/${backend.file}) center / contain no-repeat` }} />
                ) : (
                  <Box component="img" src={`/images/products/bayesflow/${backend.file}`} alt="" sx={{ width: backend.name === 'JAX' ? '64%' : '56%', height: '60%', objectFit: 'contain' }} />
                )}
              </Box>
            </Box>
          ))}
        </Box>
        <Box component="img" src="/images/products/bayesflow/bayesflow.webp" alt="" sx={{ position: 'absolute', width: '54%', height: '54%', objectFit: 'contain', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
      </Box>
    </Box>
  )
}
