import { PageHero, Section, SectionHead, TileGrid } from '@/components/PageElements'
import { MemberTile } from '@/components/Tiles'
import { coreRoles, getMembers } from '@/lib/content'

export const metadata = {
  title: 'Team',
  description:
    'The researchers of the BayesOps lab at Rensselaer Polytechnic Institute, together with collaborators at partner institutions around the world.',
  alternates: { canonical: '/team' },
}

const grid = {
  xs: 'repeat(2, minmax(0, 1fr))',
  sm: 'repeat(3, minmax(0, 1fr))',
  md: 'repeat(4, minmax(0, 1fr))',
  lg: 'repeat(6, minmax(0, 1fr))',
}

const memberGap = { xs: 2, sm: 2.5, lg: 2 }

export default function TeamPage() {
  const members = getMembers()
  const core = members
    .filter((member) => coreRoles.includes(member.role))
    .sort((a, b) => coreRoles.indexOf(a.role) - coreRoles.indexOf(b.role) || a.name.localeCompare(b.name))
  const undergraduates = members.filter((member) => member.role === 'undergrad')
  const affiliates = members.filter((member) => member.role === 'affiliate')
  const alumni = members.filter((member) => member.role === 'alumni')

  return (
    <>
      <PageHero
        title="Team"
        rule
        description="BayesOps brings together researchers from RPI and collaborators from around the world to advance collaborative research at the intersection of AI and probabilistic modeling."
        descriptionBreakAfter="from around the world"
      />

      <Section sx={{ pt: { xs: 4, md: 6 } }}>
        <SectionHead
          title="Core members"
          description="The researchers based with us at RPI."
          size="sm"
        />
        <TileGrid columns={grid} gap={memberGap}>
          {core.map((member) => (
            <MemberTile key={member.slug} member={member} />
          ))}
        </TileGrid>
      </Section>

      {undergraduates.length > 0 && (
        <Section tone="raised">
          <SectionHead
            title="Undergraduate researchers"
            description="Undergraduate students contributing to active research projects at RPI."
            size="sm"
          />
          <TileGrid columns={grid} gap={memberGap}>
            {undergraduates.map((member) => (
              <MemberTile key={member.slug} member={member} />
            ))}
          </TileGrid>
        </Section>
      )}

      {affiliates.length > 0 && (
        <Section>
          <SectionHead
            title="Collaborators"
            description="Close collaborators around the globe."
            size="sm"
          />
          <TileGrid columns={grid} gap={memberGap}>
            {affiliates.map((member) => (
              <MemberTile key={member.slug} member={member} />
            ))}
          </TileGrid>
        </Section>
      )}

      {alumni.length > 0 && (
        <Section tone="raised">
          <SectionHead
            title="Alumni"
            description="Former BayesOps researchers and collaborators."
            size="sm"
          />
          <TileGrid columns={grid} gap={memberGap}>
            {alumni.map((member) => (
              <MemberTile key={member.slug} member={member} />
            ))}
          </TileGrid>
        </Section>
      )}
    </>
  )
}
