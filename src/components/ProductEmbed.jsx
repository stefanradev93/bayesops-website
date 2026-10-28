import { Box } from '@mui/material'

/** Load the app immediately, without an extra demo toolbar or launch screen. */
export default function ProductEmbed({ href, title }) {
  return (
    <Box component="iframe" src={href} title={title} loading="eager" referrerPolicy="no-referrer" sx={{ display: 'block', width: '100%', height: { xs: 'max(760px, 100svh)', md: 'max(920px, 100svh)' }, border: 0, bgcolor: 'background.paper' }} />
  )
}
