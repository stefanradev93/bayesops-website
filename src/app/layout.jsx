import localFont from 'next/font/local'
import { Box } from '@mui/material'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import Providers from './providers'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import PageTransition from '@/components/PageTransition'
import { site, socialImage } from '@/lib/site'

const sans = localFont({
  src: './fonts/inter-latin.woff2',
  display: 'swap',
  variable: '--font-sans',
  weight: '100 900',
})

const display = localFont({
  src: './fonts/rubik-latin.woff2',
  display: 'swap',
  variable: '--font-display',
  weight: '300 900',
})

const mono = localFont({
  src: './fonts/roboto-mono-latin.woff2',
  display: 'swap',
  variable: '--font-mono',
  weight: '100 700',
})

export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.title} — ${site.subtitle}`, template: `%s | ${site.title}` },
  description: site.description,
  applicationName: site.title,
  icons: { icon: site.icon },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.title,
    title: `${site.title} — ${site.subtitle}`,
    description: site.description,
    url: site.url,
    locale: site.locale,
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.title} — ${site.subtitle}`,
    description: site.description,
    images: [socialImage],
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F4EF' },
    { media: '(prefers-color-scheme: dark)', color: '#17171F' },
  ],
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'ResearchOrganization',
  name: site.title,
  alternateName: 'BayesOps Lab',
  description: site.description,
  url: site.url,
  logo: `${site.url}${site.icon}`,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Providers>
          <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <SiteHeader />
            <Box component="main" id="main" sx={{ flex: 1 }}>
              <PageTransition>{children}</PageTransition>
            </Box>
            <SiteFooter />
          </Box>
        </Providers>
      </body>
    </html>
  )
}
