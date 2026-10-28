// Regenerates content/citations.yaml from content/sources.yaml.
//
// `sources.yaml` holds what the lab curates by hand — an id plus any of
// `type`, `description`, `image`, `tags`, `buttons`. This script resolves each
// id against its registry for the bibliographic half (title, authors, venue,
// date, link) and merges the two, with the hand-written fields winning.
//
//   npm run citations          refresh from cache where possible
//   npm run citations -- --force    ignore the cache
//   npm run citations -- --out FILE write elsewhere (for diffing)
//
// Resolvers speak to public APIs and need no key. Results are cached in
// .cache/citations.json so repeat runs are fast and work offline.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parse, Scalar, stringify } from 'yaml'

const ROOT = process.cwd()
const SOURCES = join(ROOT, 'content', 'sources.yaml')
const CACHE = join(ROOT, '.cache', 'citations.json')
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000
const HEADER = '# DO NOT EDIT, GENERATED AUTOMATICALLY FROM sources.yaml'

// Crossref asks callers to identify themselves; it buys politer rate limits.
const USER_AGENT = 'BayesOps-website/1.0 (https://bayesops.com; mailto:radevs@rpi.edu)'

const args = process.argv.slice(2)
const force = args.includes('--force')
const outIndex = args.indexOf('--out')
const OUTPUT = outIndex === -1 ? join(ROOT, 'content', 'citations.yaml') : resolve(ROOT, args[outIndex + 1])

const errors = []
const warnings = []
const log = (message, indent = 0) => console.log(`${'  '.repeat(indent)}${message}`)

// --- fetch helpers ---------------------------------------------------------

async function request(url, accept) {
  const response = await fetch(url, {
    headers: { Accept: accept, 'User-Agent': USER_AGENT },
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`)
  return response
}

const decodeEntities = (text) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')

const collapse = (text) => decodeEntities(text || '').replace(/\s+/g, ' ').trim()

/** Zero-pad a CSL `issued.date-parts` triple; month and day fall back to 1. */
function partsToDate(parts) {
  const [year, month = 1, day = 1] = parts || []
  if (!year) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

/** Force single quotes so no parser reinterprets the value as a timestamp. */
function quotedDate(value) {
  const node = new Scalar(String(value).slice(0, 10))
  node.type = Scalar.QUOTE_SINGLE
  return node
}

const cslAuthors = (authors = []) =>
  authors
    .map((author) =>
      [author.given, author.family].map((part) => (part || '').trim()).filter(Boolean).join(' ') ||
      (author.literal || '').trim(),
    )
    .filter(Boolean)

// --- resolvers -------------------------------------------------------------

/**
 * arXiv preprints, via the arXiv Atom API. Preferred over the DataCite DOI
 * record, which only carries a year.
 */
async function resolveArxiv(id) {
  const bare = id.replace(/^arxiv:/i, '').replace(/v\d+$/, '')
  const response = await request(
    `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(bare)}&max_results=1`,
    'application/atom+xml',
  )
  const xml = await response.text()

  const start = xml.indexOf('<entry>')
  const end = xml.indexOf('</entry>')
  if (start === -1 || end === -1) throw new Error(`arXiv returned no entry for ${bare}`)
  const entry = xml.slice(start, end)

  if (/<title>Error<\/title>/i.test(entry)) throw new Error(`arXiv has no record for ${bare}`)

  const field = (tag) => {
    const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
    return match ? collapse(match[1]) : ''
  }

  const title = field('title')
  if (!title) throw new Error(`arXiv entry for ${bare} has no title`)

  return {
    id,
    title,
    authors: [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => collapse(m[1])).filter(Boolean),
    // A journal reference means it has appeared somewhere; otherwise it is a preprint.
    publisher: field('arxiv:journal_ref') || 'arXiv',
    // `published` is the v1 submission; `updated` is the current version, which
    // is the date that matches the venue for anything since revised.
    date: ((field('updated') || field('published')).match(/^\d{4}-\d{2}-\d{2}/) || [''])[0],
    link: `https://arxiv.org/abs/${bare}`,
  }
}

/**
 * Anything with a DOI, via doi.org content negotiation. This returns CSL-JSON
 * from whichever registry owns the DOI (Crossref, DataCite, mEDRA, …).
 */
async function resolveDoi(id) {
  const doi = id.replace(/^doi:/i, '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
  const response = await request(
    `https://doi.org/${doi}`,
    'application/vnd.citationstyles.csl+json',
  )
  const data = await response.json()

  const container = (Array.isArray(data['container-title']) ? data['container-title'][0] : data['container-title']) || ''
  const collection = (Array.isArray(data['collection-title']) ? data['collection-title'][0] : data['collection-title']) || ''
  const title = Array.isArray(data.title) ? data.title[0] : data.title

  return {
    id,
    title: collapse(title),
    authors: cslAuthors(data.author),
    // Same precedence the previous pipeline used: journal, then publisher, then series.
    publisher: (container || data.publisher || collection || '').trim(),
    date: partsToDate(
      data.issued?.['date-parts']?.[0] || data['published-print']?.['date-parts']?.[0] || data['published-online']?.['date-parts']?.[0],
    ),
    // Prefer a canonical https doi.org link over the registry's own redirect.
    link: `https://doi.org/${doi}`,
  }
}

/** PubMed records, via NCBI esummary. */
async function resolvePubmed(id) {
  const pmid = id.replace(/^(pubmed|pmid):/i, '')
  const response = await request(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${encodeURIComponent(pmid)}&retmode=json`,
    'application/json',
  )
  const record = (await response.json()).result?.[pmid]
  if (!record || record.error) throw new Error(`PubMed has no record for ${pmid}`)

  const date = new Date(record.sortpubdate || record.pubdate || '')
  return {
    id,
    title: collapse(record.title),
    authors: (record.authors || []).map((author) => collapse(author.name)).filter(Boolean),
    publisher: collapse(record.fulljournalname || record.source),
    date: Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10),
    link: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
  }
}

function resolverFor(id) {
  if (/^arxiv:/i.test(id)) return resolveArxiv
  if (/^(pubmed|pmid):/i.test(id)) return resolvePubmed
  if (/^doi:/i.test(id) || /^10\./.test(id) || /doi\.org\//i.test(id)) return resolveDoi
  return null
}

// --- cache -----------------------------------------------------------------

async function loadCache() {
  if (force || !existsSync(CACHE)) return {}
  try {
    return JSON.parse(await readFile(CACHE, 'utf8'))
  } catch {
    return {}
  }
}

async function saveCache(cache) {
  await mkdir(dirname(CACHE), { recursive: true })
  await writeFile(CACHE, `${JSON.stringify(cache, null, 2)}\n`)
}

// --- main ------------------------------------------------------------------

async function main() {
  const sources = parse(await readFile(SOURCES, 'utf8')) || []
  if (!Array.isArray(sources)) throw new Error('sources.yaml must be a list')

  // Merge entries sharing an id, later ones overriding earlier ones.
  const merged = []
  const byId = new Map()
  for (const source of sources) {
    const id = String(source?.id || '').trim()
    if (id && byId.has(id)) {
      log(`Merging duplicate ${id}`, 1)
      Object.assign(byId.get(id), source)
      continue
    }
    const entry = { ...source }
    if (id) byId.set(id, entry)
    merged.push(entry)
  }

  log(`${merged.length} source(s) in sources.yaml`)

  const cache = await loadCache()
  const citations = []
  let fetched = 0
  let cached = 0

  for (const [index, source] of merged.entries()) {
    if (source.remove === true) continue

    const id = String(source.id || '').trim()
    const label = id || source.title || `entry ${index + 1}`
    let metadata = {}

    if (id) {
      const entry = cache[id]
      if (entry && Date.now() - entry.at < CACHE_TTL_MS) {
        metadata = entry.data
        cached += 1
      } else {
        const resolve = resolverFor(id)
        if (!resolve) {
          const message = `No resolver for id "${id}" (expected arXiv:…, a DOI, or pubmed:…)`
          log(`ERROR  ${message}`, 1)
          errors.push(message)
          continue
        }
        try {
          metadata = await resolve(id)
          cache[id] = { at: Date.now(), data: metadata }
          fetched += 1
          log(`fetched  ${label}`, 1)
        } catch (error) {
          const message = `Could not resolve ${id}: ${error.message}`
          log(`ERROR  ${message}`, 1)
          errors.push(message)
          continue
        }
      }
    } else {
      warnings.push(`Source ${index + 1} has no id; using its hand-written fields only`)
    }

    // Hand-written fields win over anything the registry returned.
    const citation = { ...metadata, ...source }
    if (citation.date) citation.date = quotedDate(citation.date)
    citations.push(citation)
  }

  await saveCache(cache)

  const yaml = stringify(citations, { lineWidth: 0, aliasDuplicateObjects: false })
  await writeFile(OUTPUT, `${HEADER}\n\n${yaml}`)

  log('')
  log(`${citations.length} citation(s) written to ${OUTPUT.replace(`${ROOT}/`, '')}`)
  log(`${fetched} fetched, ${cached} from cache`)

  for (const warning of warnings) log(`WARNING  ${warning}`)
  for (const error of errors) log(`ERROR  ${error}`)
  if (errors.length) process.exitCode = 1
}

await main()
