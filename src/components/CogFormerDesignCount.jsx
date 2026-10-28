import { Box, Typography } from '@mui/material'
import AnimatedStatNumber from './AnimatedStatNumber'

const format = new Intl.NumberFormat('en-US')

export default function CogFormerDesignCount({ value, label, detail }) {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 0 }}>
      <Typography color="text.secondary" sx={{ mb: 4, mx: 'auto', maxWidth: 760, textWrap: 'balance', fontSize: { xs: '1rem', md: '1.35rem' } }}>{detail}</Typography>
      <Typography component="h2" aria-label={`${format.format(value)} ${label}`} sx={{ fontFamily: 'var(--font-display)', fontWeight: 450, lineHeight: 1.05, letterSpacing: '-.045em' }}>
        <Box component="span" aria-hidden="true" sx={{ display: 'block', color: 'primary.main', fontSize: 'clamp(1.65rem, 7.8vw, 9rem)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}><AnimatedStatNumber value={format.format(value)} animationKey="cogformer-designs" /></Box>
        <Box component="span" aria-hidden="true" sx={{ display: 'block', mt: 2, fontSize: { xs: '2rem', md: '3rem' } }}>{label}</Box>
      </Typography>
    </Box>
  )
}
