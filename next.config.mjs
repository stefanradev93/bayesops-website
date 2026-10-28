/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site: `next build` emits `out/`, deployable to any static host
  // (GitHub Pages included) with no Node server and no SPA-fallback rewrite.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
