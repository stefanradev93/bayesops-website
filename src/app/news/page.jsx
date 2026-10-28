import NewsTimeline from '@/components/NewsTimeline'
import { PageHero, Section, SectionHead } from '@/components/PageElements'
import { getAllNews } from '@/lib/content'

export const metadata = {
  title: 'News',
  description: 'News, milestones, visits, talks, workshops, and publications from the BayesOps research lab.',
  alternates: { canonical: '/news' },
}

export default function NewsPage() {
  const news = getAllNews()

  return (
    <>
      <PageHero
        title="News"
        description="Milestones, visits, talks, workshops, and publications from the BayesOps lab."
      />

      <Section sx={{ pt: { xs: 4, md: 6 } }}>
        <SectionHead
          title="Latest updates"
          size="sm"
          description="Lab news and updates, newest first."
        />
        <NewsTimeline entries={news} />
      </Section>
    </>
  )
}
