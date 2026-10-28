// Pure formatting helpers, importable from both server and client components.
// Kept free of `node:fs` so the tile components can be bundled for the client.

/**
 * Content paths in the YAML/Markdown are host-relative (`images/…`). Raster
 * sources resolve to the WebP built by `scripts/optimize-images.mjs`; SVGs and
 * anything else pass through untouched.
 */
export const assetUrl = (path) => {
  if (!path) return '/images/fallback.svg'
  const url = `/${String(path).replace(/^\//, '')}`
  return url.replace(/\.(png|jpe?g)$/i, '.webp')
}

export const roles = {
  pi: { label: 'Principal Investigator', plural: 'Principal Investigator' },
  postdoc: { label: 'Postdoctoral Researcher', plural: 'Postdoctoral Researchers' },
  phd: { label: 'PhD Student', plural: 'PhD Students' },
  msc: { label: 'MSc Student', plural: 'MSc Students' },
  undergrad: { label: 'Undergraduate Student', plural: 'Undergraduate Students' },
  affiliate: { label: 'Collaborator', plural: 'Collaborators' },
  alumni: { label: 'Alumnus', plural: 'Alumni' },
}

export const coreRoles = ['pi', 'postdoc', 'phd', 'msc']

/** Link types a member can declare in front matter, from `_data/types.yaml`. */
export const linkTypes = {
  email: { label: 'Email', url: (value) => `mailto:${value}` },
  'home-page': { label: 'Home page', url: (value) => value },
  website: { label: 'Website', url: (value) => value },
  'google-scholar': {
    label: 'Google Scholar',
    url: (value) => `https://scholar.google.com/citations?user=${value}`,
  },
  orcid: { label: 'ORCID', url: (value) => `https://orcid.org/${value}` },
  github: { label: 'GitHub', url: (value) => `https://github.com/${value}` },
  bluesky: { label: 'Bluesky', url: (value) => `https://bsky.app/profile/${value}` },
  linkedin: {
    label: 'LinkedIn',
    url: (value) => (value.startsWith('http') ? value : `https://www.linkedin.com/in/${value}`),
  },
  twitter: { label: 'Twitter', url: (value) => `https://twitter.com/${value}` },
}

export const roleLabel = (member) => member.description || roles[member.role]?.label || ''

export const publicationYear = (citation) =>
  citation.date ? new Date(`${citation.date}T00:00:00`).getFullYear() : null

export const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
