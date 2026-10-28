import { notFound } from 'next/navigation'
import CollectionDetail from '@/components/CollectionDetail'
import { assetUrl, getAllProjects, getProject } from '@/lib/content'
import { site, socialImage } from '@/lib/site'

const projectActions = (project) => {
  const actions = [
    project.link && { label: 'Visit project', href: project.link },
    project.repo && { label: 'Source code', href: `https://github.com/${project.repo}` },
  ].filter(Boolean)

  return actions.filter(
    (action, index) => actions.findIndex((candidate) => candidate.href === action.href) === index,
  )
}

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) return {}

  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: 'website',
      title: project.title,
      description: site.description,
      url: `/projects/${project.slug}`,
      images: [socialImage],
    },
  }
}

export default async function ProjectPage({ params }) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) notFound()

  const schema = {
    '@context': 'https://schema.org',
    '@type': (project.tags || []).includes('software') ? 'SoftwareSourceCode' : 'CreativeWork',
    name: project.title,
    description: project.description,
    url: `${site.url}/projects/${project.slug}`,
    sameAs: project.link,
    image: project.image ? `${site.url}${assetUrl(project.image)}` : undefined,
    creator: { '@type': 'Organization', name: site.title, url: site.url },
  }

  return (
    <CollectionDetail
      item={project}
      collectionHref="/projects"
      collectionLabel="Projects"
      eyebrow={project.subtitle}
      actions={projectActions(project)}
      schema={schema}
    />
  )
}
