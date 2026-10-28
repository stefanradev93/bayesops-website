// Static export disables Next's on-demand image optimizer, so whatever sits in
// `public/` ships byte-for-byte — and the source imagery is nearly 40 MB of
// 2500px PNGs and JPEGs.
//
// Sources therefore live in `assets/images/` (tracked in git) and this pass
// builds `public/images/` from them: rasters are resized and re-encoded as
// WebP, everything else (SVG, icons) is copied through. `assetUrl` in
// `src/lib/format.js` rewrites `.png`/`.jpg` references to `.webp` to match.
//
// `public/images/` is a gitignored build artifact, refreshed on every build.

import { copyFile, mkdir, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import sharp from 'sharp'

const SOURCE_DIR = join(process.cwd(), 'assets', 'images')
const OUTPUT_DIR = join(process.cwd(), 'public', 'images')
const RASTER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg'])
const SOCIAL_IMAGE = {
  source: join(SOURCE_DIR, 'bayesops-logo.svg'),
  target: join(OUTPUT_DIR, 'bayesops-social.png'),
  width: 1200,
  height: 630,
  logoWidth: 900,
  background: '#17171F',
}

// Widest each image is ever displayed, doubled for high-density screens.
const WIDTH_RULES = [
  { match: /[\\/]members[\\/]/, width: 900 },
  { match: /[\\/]research[\\/]/, width: 1000 },
  { match: /[\\/]projects[\\/]/, width: 1000 },
  { match: /[\\/]index[\\/]/, width: 1200 },
  { match: /background\./, width: 2400 },
]
const DEFAULT_WIDTH = 1200

const targetWidth = (path) => WIDTH_RULES.find((rule) => rule.match.test(path))?.width ?? DEFAULT_WIDTH

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else yield path
  }
}

/** True when the output is missing or older than its source. */
async function isStale(source, target) {
  if (!existsSync(target)) return true
  const [sourceStat, targetStat] = await Promise.all([stat(source), stat(target)])
  return targetStat.mtimeMs < sourceStat.mtimeMs
}

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.log(`No ${relative(process.cwd(), SOURCE_DIR)} directory; skipping image optimization.`)
    return
  }

  let converted = 0
  let copied = 0
  let generated = 0
  let fresh = 0
  let sourceBytes = 0
  let outputBytes = 0

  for await (const source of walk(SOURCE_DIR)) {
    const extension = extname(source).toLowerCase()
    const isRaster = RASTER_EXTENSIONS.has(extension)
    const relativePath = relative(SOURCE_DIR, source)
    const target = join(OUTPUT_DIR, isRaster ? relativePath.replace(/\.(png|jpe?g)$/i, '.webp') : relativePath)

    sourceBytes += (await stat(source)).size

    if (!(await isStale(source, target))) {
      outputBytes += (await stat(target)).size
      fresh += 1
      continue
    }

    await mkdir(dirname(target), { recursive: true })

    if (isRaster) {
      const info = await sharp(source)
        .resize({ width: targetWidth(source), withoutEnlargement: true })
        .webp({ quality: 82, effort: 5 })
        .toFile(target)
      outputBytes += info.size
      converted += 1
    } else {
      await copyFile(source, target)
      outputBytes += (await stat(target)).size
      copied += 1
    }
  }

  // Social crawlers are unreliable with SVG, so render the long-format logo
  // onto a standard Open Graph canvas and keep this one asset as PNG.
  const socialLogo = await sharp(SOCIAL_IMAGE.source, { density: 300 })
    .resize({ width: SOCIAL_IMAGE.logoWidth })
    .png()
    .toBuffer()
  await mkdir(dirname(SOCIAL_IMAGE.target), { recursive: true })
  const socialImageInfo = await sharp({
    create: {
      width: SOCIAL_IMAGE.width,
      height: SOCIAL_IMAGE.height,
      channels: 4,
      background: SOCIAL_IMAGE.background,
    },
  })
    .composite([{ input: socialLogo, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(SOCIAL_IMAGE.target)
  outputBytes += socialImageInfo.size
  generated += 1

  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1)
  console.log(
    `Images: ${converted} converted, ${copied} copied, ${generated} generated, ${fresh} up to date — ` +
      `${mb(sourceBytes)} MB source → ${mb(outputBytes)} MB served`,
  )
}

await main()
