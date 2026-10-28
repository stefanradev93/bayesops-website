import ProductIndex from '@/components/ProductIndex'

export const metadata = {
  title: 'Products',
  description: 'Software and interactive Bayesian workflow tools from the BayesOps lab.',
  alternates: { canonical: '/products' },
}

export default function ProductsPage() {
  return <ProductIndex />
}
