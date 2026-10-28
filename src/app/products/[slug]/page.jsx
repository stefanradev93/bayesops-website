import { notFound } from 'next/navigation'
import CollectionDetail from '@/components/CollectionDetail'
import ProductStory from '@/components/ProductStory'
import { assetUrl, getProduct, getProducts, getProductStory } from '@/lib/content'
import { site } from '@/lib/site'

const sourceUrl = (repo) =>
  repo && (repo.startsWith('http://') || repo.startsWith('https://'))
    ? repo
    : repo && `https://github.com/${repo}`

const normalizeUrl = (url) => url.replace(/\/+$/, '')

const productActions = (product) => {
  const actions = [
    product.link && { label: product.linkLabel || 'Visit product', href: product.link },
    product.repo && { label: 'Source code', href: sourceUrl(product.repo) },
  ].filter(Boolean)

  return actions.filter(
    (action, index) =>
      actions.findIndex((candidate) => normalizeUrl(candidate.href) === normalizeUrl(action.href)) === index,
  )
}

export function generateStaticParams() {
  return getProducts().map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return {}

  return {
    title: product.title,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.title,
      description: product.description,
      url: `/products/${product.slug}`,
      ...(product.image ? { images: [{ url: assetUrl(product.image), alt: product.title }] } : {}),
    },
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()
  const actions = productActions(product)
  const story = getProductStory(slug)

  const schema = {
    '@context': 'https://schema.org',
    '@type': product.repo ? 'SoftwareSourceCode' : 'SoftwareApplication',
    name: product.title,
    description: product.description,
    url: `${site.url}/products/${product.slug}`,
    sameAs: product.link,
    image: product.image ? `${site.url}${assetUrl(product.image)}` : undefined,
    author: { '@type': 'Organization', name: site.title, url: site.url },
  }

  if (story) return <ProductStory item={product} story={story} actions={actions} schema={schema} />

  return (
    <CollectionDetail
      item={product}
      collectionHref="/products"
      collectionLabel="Products"
      eyebrow={product.subtitle}
      actions={actions}
      actionsAside={actions.length > 0}
      schema={schema}
    />
  )
}
