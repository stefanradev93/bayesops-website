import { PageHero, Section, TileGrid } from '@/components/PageElements'
import { CollectionTile } from '@/components/Tiles'
import { getAllProjects } from '@/lib/content'

export const metadata = {
  title: 'Projects',
  description:
    'Open-source software, neural architectures, and applied research from the BayesOps lab, supported by the National Science Foundation and National Institutes of Health.',
  alternates: { canonical: '/projects' },
}

export default function ProjectsPage() {
  const projects = getAllProjects()

  return (
    <>
      <PageHero
        title="Projects"
        description="We develop robust software and novel neural architectures for end-to-end Bayesian modeling. The lab is generously supported by the National Science Foundation and the National Institutes of Health."
      />

      <Section sx={{ pt: { xs: 4, md: 6 } }}>
        <TileGrid columns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
          {projects.map((project) => (
            <CollectionTile
              key={project.slug}
              item={project}
              href={`/projects/${project.slug}`}
              kind="project"
              eyebrow={project.subtitle}
            />
          ))}
        </TileGrid>
      </Section>
    </>
  )
}
