import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import { Box, Typography } from '@mui/material'
import MarkdownContent from './MarkdownContent'

/** A Material UI timeline with its axis pinned to the left edge. */
export default function NewsTimeline({ entries = [], alignAxis = false }) {
  if (!entries.length) return null

  return (
    <Timeline
      position="right"
      sx={{
        m: 0,
        p: 0,
        width: alignAxis ? { xs: '100%', md: 'calc(100% + 5px)' } : '100%',
        ml: alignAxis ? { md: '-5px' } : 0,
        // MUI reserves an empty opposite-content column by default. Removing
        // it keeps the timeline axis at the left instead of in the middle.
        '& .MuiTimelineItem-root::before': {
          display: 'none !important',
        },
      }}
    >
      {entries.map((entry, index) => (
        <TimelineItem key={entry.heading} sx={{ minHeight: 0, minWidth: 0 }}>
          <TimelineSeparator>
            <TimelineDot
              variant={index === 0 ? 'filled' : 'outlined'}
              sx={{
                my: 1.1,
                p: 0,
                width: 10,
                height: 10,
                borderWidth: '1px',
                boxShadow: 'none',
                bgcolor: index === 0 ? 'secondary.main' : 'transparent',
                borderColor: index === 0 ? 'secondary.main' : 'primary.main',
              }}
            />
            {index < entries.length - 1 && (
              <TimelineConnector
                sx={{
                  width: '1px',
                  bgcolor: 'divider',
                }}
              />
            )}
          </TimelineSeparator>
          <TimelineContent
            sx={{
              minWidth: 0,
              pt: 0,
              pb: { xs: 4, md: 5 },
              pl: { xs: 2.5, md: 4 },
              pr: 0,
            }}
          >
            <Box
              sx={{
                minWidth: 0,
                overflowWrap: 'anywhere',
              }}
            >
              <Typography
                component="h3"
                sx={{
                  display: 'block',
                  mb: 1.5,
                  color: 'text.primary',
                  fontFamily: 'var(--font-display)',
                  fontSize: { xs: '1.2rem', md: '1.4rem' },
                  fontWeight: 500,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                }}
              >
                {entry.heading}
              </Typography>
              <MarkdownContent size="sm">{entry.body}</MarkdownContent>
            </Box>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )
}
