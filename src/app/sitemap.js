import { getCitations, getMembers, getProducts } from '@/lib/content'
import { nav, site } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap() {
  const now = new Date()
  // `trailingSlash: true` means the exported URLs all end in a slash.
  const url = (path) => `${site.url}${path}`.replace(/\/?$/, '/')

  return [
    { url: url('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: url('/news'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    ...nav.map((item) => ({
      url: url(item.href),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    ...getMembers().map((member) => ({
      url: url(`/members/${member.slug}`),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.6,
    })),
    ...getCitations().map((paper) => ({
      url: url(`/research/${paper.slug}`),
      lastModified: paper.date ? new Date(paper.date) : now,
      changeFrequency: 'yearly',
      priority: 0.7,
    })),
    ...getProducts().map((product) => ({
      url: url(`/products/${product.slug}`),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
  ]
}
