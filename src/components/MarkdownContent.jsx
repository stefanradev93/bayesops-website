import { Box, Typography } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownLink } from './links'

/** Prose renderer for member bios and the news lists. */
export default function MarkdownContent({ children, size = 'md' }) {
  return (
    <Box
      sx={{
        color: 'text.secondary',
        fontSize: size === 'sm' ? '0.95rem' : '1.05rem',
        lineHeight: 1.7,
        '& p': { mt: 0, mb: 2 },
        '& ul, & ol': { pl: 2.5, mb: 2, mt: 0 },
        '& li': { mb: 0.75 },
        '& li::marker': { color: 'text.secondary', opacity: 0.6 },
        '& strong': { color: 'text.primary', fontWeight: 600 },
        '& blockquote': {
          m: 0,
          my: 3,
          pl: 2.5,
          borderLeft: '2px solid',
          borderColor: 'divider',
          fontStyle: 'italic',
        },
        '& code': {
          fontSize: '0.88em',
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          bgcolor: 'surface.raised',
        },
        '& pre': { p: 2, borderRadius: 2, bgcolor: 'surface.raised', overflowX: 'auto' },
        '& pre code': { p: 0, bgcolor: 'transparent' },
        '& img': { maxWidth: '100%', height: 'auto', borderRadius: 4 },
        '& hr': { border: 0, borderTop: '1px solid', borderColor: 'divider', my: 4 },
        // Wide tables scroll inside themselves rather than widening the page.
        '& table': { display: 'block', overflowX: 'auto', width: '100%', borderCollapse: 'collapse', mb: 2 },
        '& th, & td': { textAlign: 'left', p: 1.25, borderBottom: '1px solid', borderColor: 'divider' },
        '& th': { color: 'text.primary', fontWeight: 600, whiteSpace: 'nowrap' },
        '& > :last-child': { mb: 0 },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: MarkdownLink,
          h1: ({ children: content }) => (
            <Typography component="h2" variant="h3" color="text.primary" sx={{ mt: 5, mb: 2 }}>
              {content}
            </Typography>
          ),
          h2: ({ children: content }) => (
            <Typography component="h2" variant="h4" color="text.primary" sx={{ mt: 5, mb: 2 }}>
              {content}
            </Typography>
          ),
          h3: ({ children: content }) => (
            <Typography component="h3" variant="h5" color="text.primary" sx={{ mt: 4, mb: 1.5 }}>
              {content}
            </Typography>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </Box>
  )
}
