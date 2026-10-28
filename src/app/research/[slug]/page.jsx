import { notFound } from 'next/navigation'
import CollectionDetail from '@/components/CollectionDetail'
import { assetUrl, getCitations, getPaper, publicationYear } from '@/lib/content'
import { site, socialImage } from '@/lib/site'

const resourceLabels = {
  paper: 'Paper',
  source: 'Source code',
  website: 'Website',
}

const paperActions = (paper) => {
  const actions = [
    paper.link && { label: 'Read paper', href: paper.link },
    ...(paper.buttons || []).map((button) => ({
      label: button.text || resourceLabels[button.type] || 'Related resource',
      href: button.link,
    })),
  ].filter((action) => action?.href)

  return actions.filter(
    (action, index) => actions.findIndex((candidate) => candidate.href === action.href) === index,
  )
}

export function generateStaticParams() {
  return getCitations().map((paper) => ({ slug: paper.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const paper = getPaper(slug)
  if (!paper) return {}

  return {
    title: paper.title,
    description: paper.description,
    alternates: { canonical: `/research/${paper.slug}` },
    openGraph: {
      type: 'article',
      title: paper.title,
      description: site.description,
      url: `/research/${paper.slug}`,
      publishedTime: paper.date,
      images: [socialImage],
    },
  }
}

export default async function PaperPage({ params }) {
  const { slug } = await params
  const paper = getPaper(slug)
  if (!paper) notFound()

  const year = publicationYear(paper)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: paper.title,
    description: paper.description,
    datePublished: paper.date,
    author: (paper.authors || []).map((name) => ({ '@type': 'Person', name })),
    isPartOf: paper.publisher ? { '@type': 'Periodical', name: paper.publisher } : undefined,
    url: `${site.url}/research/${paper.slug}`,
    sameAs: paper.link,
    image: paper.image ? `${site.url}${assetUrl(paper.image)}` : undefined,
  }

  return (
    <CollectionDetail
      item={paper}
      collectionHref="/research"
      collectionLabel="Research"
      eyebrow={[paper.publisher, year].filter(Boolean).join(' · ')}
      byline={(paper.authors || []).join(', ')}
      actions={paperActions(paper)}
      actionsAside
      schema={schema}
    />
  )
}
