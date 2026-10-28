import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { roleLabel } from './format.js'

// Content lives outside `src/` and is read at build time, so every page is
// statically rendered with its real text instead of hydrating it client-side.
const contentDir = join(process.cwd(), 'content')

const read = (...segments) => readFileSync(join(contentDir, ...segments), 'utf8')
const readYaml = (file) => parse(read(file)) || []

const slugify = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const withSlugs = (items) =>
  items.map((item) => ({ ...item, slug: item.slug || slugify(item.title) }))

function parseFrontMatter(raw, slug) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { slug, body: raw.trim() }
  return { slug, ...parse(match[1]), body: match[2].trim() }
}

function loadMarkdown(dir) {
  return readdirSync(join(contentDir, dir))
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filename = file.replace(/\.md$/, '')
      return parseFrontMatter(read(dir, file), filename)
    })
}

// Formatting helpers live in `./format` so client components can share them.
export * from './format.js'

export const getCitations = () => withSlugs(readYaml('citations.yaml'))
export const getAwards = () => withSlugs(readYaml('awards.yaml'))
export const getProducts = () => withSlugs(readYaml('products.yaml'))
export const getProductStory = (slug) => readYaml('product-stories.yaml').find((story) => story.slug === slug)
export const getBayesFlowDemo = () => JSON.parse(read('demos', 'bayesflow-lotka-volterra.json'))
export const getSuperstatsDemo = () => JSON.parse(read('demos', 'superstats-ddm.json'))
export const getApplications = () => withSlugs(readYaml('applications.yaml'))
// These aliases keep the former collection routes working while Products is
// the canonical home for software and tools.
export const getApps = getProducts
export const getAllProjects = () => [...getAwards(), ...getProducts(), ...getApplications()]
export const getProjects = getAllProjects

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** News files are Markdown grouped under `### <Month Year>` headings. */
function parseNews(raw) {
  return raw
    .split(/^###\s+/m)
    .slice(1)
    .map((block) => {
      const [heading, ...rest] = block.split('\n')
      const label = heading.trim()
      const match = label.match(/^([A-Za-z]+)\s+(\d{4})$/)
      const month = match ? monthNames.indexOf(match[1]) : -1
      const year = match ? Number(match[2]) : Number.NaN

      return {
        heading: label,
        body: rest.join('\n').trim(),
        // A numeric key avoids locale and timezone differences during static builds.
        monthIndex: month >= 0 && Number.isFinite(year) ? year * 12 + month : -1,
      }
    })
    .filter((entry) => entry.body)
}

export const getAllNews = () =>
  [...parseNews(read('news.md')), ...parseNews(read('news-archive.md'))].sort(
    (a, b) => b.monthIndex - a.monthIndex,
  )

/**
 * Split month-based news into the current calendar month plus the previous
 * five months, and everything older. This is intentionally calendar-based
 * because news entries have month—not day—precision.
 */
export function partitionNews(entries, { months = 6, now = new Date() } = {}) {
  const cutoff = now.getUTCFullYear() * 12 + now.getUTCMonth() - (months - 1)
  return {
    recent: entries.filter((entry) => entry.monthIndex >= cutoff),
    archive: entries.filter((entry) => entry.monthIndex < cutoff),
  }
}

export const getNews = () => partitionNews(getAllNews()).recent
export const getNewsArchive = () => partitionNews(getAllNews()).archive

export const getMembers = () =>
  loadMarkdown('members').sort((a, b) => a.name.localeCompare(b.name))

export const getMember = (slug) => getMembers().find((member) => member.slug === slug)
export const getPaper = (slug) => getCitations().find((paper) => paper.slug === slug)
export const getProject = (slug) => getAllProjects().find((project) => project.slug === slug)
export const getProduct = (slug) => getProducts().find((product) => product.slug === slug)
export const getApp = getProduct

/** Flat index backing the site-wide search on the 404 page. */
export function getSearchIndex() {
  const members = getMembers()
  const awards = getAwards()
  const products = getProducts()
  return [
    ...[
      { title: 'Research', text: 'Research directions, awards, and recent papers', href: '/research' },
      { title: 'Products', text: 'Software and tools from BayesOps research', href: '/products' },
      { title: 'Team', text: 'Core researchers and collaborators', href: '/team' },
      { title: 'News', text: 'Updates from the BayesOps lab', href: '/news' },
      { title: 'Contact', text: 'Email, address, and location', href: '/contact' },
    ],
    ...members.map((item) => ({
      title: item.name,
      text: `${roleLabel(item)} ${item.institution || ''} ${item.body}`,
      href: `/members/${item.slug}`,
      kind: 'Team',
    })),
    ...awards.map((item) => ({
      title: item.title,
      text: `${item.subtitle} ${item.description}`,
      href: '/research#awards',
      kind: 'Research',
    })),
    ...products.map((item) => ({
      title: item.title,
      text: `${item.subtitle} ${item.description}`,
      href: `/products/${item.slug}`,
      kind: 'Products',
    })),
    ...getCitations().map((item) => ({
      title: item.title,
      text: `${item.description} ${(item.authors || []).join(' ')}`,
      href: `/research/${item.slug}`,
      kind: 'Research',
    })),
  ]
}
