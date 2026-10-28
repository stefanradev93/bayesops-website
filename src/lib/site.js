// Single source of truth for site-wide identity, links, and navigation.
// Mirrors the `_config.yaml` of the original Jekyll site.

export const site = {
  title: 'BayesOps',
  subtitle: 'Where AI meets Bayesian statistics',
  description:
    'We build fast Bayesian methods for the age of AI that transcend disciplines and live beyond the words of a paper.',
  url: 'https://bayesops.com',
  locale: 'en_US',
  share: '/images/bayesops-social.png',
  icon: '/images/bayesops-icon.svg',
  logo: '/images/bayesops-logo.svg',
}

export const socialImage = {
  url: site.share,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: `${site.title} logo`,
}

export const social = [
  { type: 'github', label: 'GitHub', href: 'https://github.com/bayesflow-org/bayesflow' },
  {
    type: 'google-scholar',
    label: 'Google Scholar',
    href: 'https://scholar.google.com/citations?user=JbDfkRkAAAAJ&hl=en',
  },
  { type: 'bluesky', label: 'Bluesky', href: 'https://bsky.app/profile/bayesflow.org' },
]

export const nav = [
  { label: 'Research', href: '/research', tooltip: 'Research directions, awards, and papers' },
  { label: 'Products', href: '/products', tooltip: 'Software and research tools' },
  { label: 'Team', href: '/team', tooltip: 'About our team' },
]

// Grouped link columns for the footer, in the style of a site-wide directory.
export const footerNav = [
  {
    heading: 'Research',
    links: [
      { label: 'Research overview', href: '/research' },
      { label: 'Awards', href: '/research#awards' },
      { label: 'Recent papers', href: '/research#publications' },
      { label: 'Google Scholar', href: social[1].href },
    ],
  },
  {
    heading: 'Products',
    links: [
      { label: 'All products', href: '/products' },
      { label: 'BayesFlow', href: '/products/bayesflow' },
      { label: 'fNIRS SimBox', href: '/products/fnirs' },
      { label: 'superstats', href: '/products/superstats' },
    ],
  },
  {
    heading: 'Lab',
    links: [
      { label: 'Team', href: '/team' },
      { label: 'News', href: '/news' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Connect',
    links: [
      { label: 'Email the lab', href: '/contact' },
      { label: 'GitHub', href: social[0].href },
      { label: 'Bluesky', href: social[2].href },
    ],
  },
]
