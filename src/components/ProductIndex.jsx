import { PageHero, Section, TileGrid } from '@/components/PageElements'
import { CollectionTile } from '@/components/Tiles'
import { getProducts } from '@/lib/content'

export default function ProductIndex() {
  const products = getProducts()

  return (
    <>
      <PageHero
        title="Products"
        rule={false}
        description="Explore software and interactive tools that turn our research into practical Bayesian modeling workflows."
        descriptionBreakAfter="research into"
      />

      <Section sx={{ pt: { xs: 0, md: 0 } }}>
        <TileGrid columns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
          {products.map((product) => (
            <CollectionTile
              key={product.slug}
              item={product}
              href={`/products/${product.slug}`}
              kind="product"
              eyebrow={product.subtitle}
              eyebrowSize={{ xs: '0.75rem', sm: '0.8rem' }}
            />
          ))}
        </TileGrid>
      </Section>
    </>
  )
}
