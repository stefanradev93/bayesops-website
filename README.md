# BayesOps website

The BayesOps lab website, built with **Next.js (App Router)** and **Material UI**.

The site is exported as fully static HTML — every page, including each publication
list and team profile, is rendered at build time. There is no server
to run and no client-side data fetching, so the content is in the HTML that search
engines and link previews see.

## Running locally

### Prerequisites

- **Node.js 20.9 or newer** (an active LTS release is recommended)
- **npm**, which is included with Node.js
- An internet connection for the initial dependency install and the first
  compilation of the self-hosted Google fonts

No database, API keys, or environment variables are required to run the site.

### Install and start the development server

From a terminal, enter the repository directory and install the exact versions
recorded in `package-lock.json`:

```bash
cd path/to/website
npm ci
```

Start the development server:

```bash
npm run dev
```

Open <http://localhost:4000> in a browser. Next.js watches the source and content
files and refreshes the page as they change. Stop the server with `Ctrl+C`.

The development command first runs the image optimizer. It creates the
gitignored `public/images/` directory from the source files in `assets/images/`,
then starts Next.js. Seeing image-conversion output before the server starts is
expected.

Use `npm install` instead of `npm ci` only when intentionally changing or adding
dependencies, since it may update `package-lock.json`.

### Test a production build locally

Run the same checks used before deployment:

```bash
npm run lint
npm run build
```

The build command optimizes images and exports the fully static site to `out/`.
Preview that exported site at <http://localhost:4000>:

```bash
npm start
```

`npm start` uses `npx serve`, which may download the small `serve` utility the
first time it is run. As an alternative, systems with Python 3 can serve the
same export with:

```bash
python3 -m http.server 4000 -d out
```

### Useful local commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Optimize images and start the development server on port 4000. |
| `npm run lint` | Check the source with ESLint. |
| `npm run build` | Create the production-ready static export in `out/`. |
| `npm start` | Serve the existing `out/` export on port 4000. |
| `npm run optimize:images` | Regenerate only `public/images/`. |
| `npm run citations` | Refresh publication metadata; this requires internet access. |

If port 4000 is already occupied, stop the process using it or run the image
step and Next.js manually on another port:

```bash
npm run optimize:images
npx next dev -p 4001
```

## Layout of the repository

| Path | Contents |
| --- | --- |
| `src/app/` | Routes. Each directory is a URL segment; `page.jsx` renders it. |
| `src/components/` | Header, footer, tiles, Markdown renderer, search and filter widgets. |
| `src/lib/content.js` | Reads `content/` at build time. Server-only (`node:fs`). |
| `src/lib/format.js` | Formatting helpers shared by server and client components. |
| `src/lib/site.js` | Site title, URL, contact details, navigation, footer columns. |
| `src/theme/theme.js` | Palette, typography, shape, and Material UI component defaults. |
| `content/` | All editable content (see below). |
| `assets/images/` | Source images, at full resolution. |
| `public/` | `CNAME`, `.nojekyll`, and the generated `images/`. |
| `scripts/` | Citation resolution, image optimization, RSS feed generation. |

## Editing content

Everything editable lives in `content/`:

- `content/sources.yaml` — **publications, source of truth.** Add a paper by its
  DOI or arXiv ID here, not in `citations.yaml`.
- `content/citations.yaml` — generated from `sources.yaml`; do not edit by hand.
- `content/awards.yaml` — funded research awards shown between the research directions and papers.
- `content/products.yaml` — software and research products, including their detail pages.
- `content/product-stories.yaml` — product headlines, highlights, supporting copy, and sources for the four editorial product pages. Numbers describe documented capabilities, not performance benchmarks; keep scope and source notes alongside each claim.
- `content/demos/bayesflow-lotka-volterra.json` — recorded simulations and real trained-network results for the interactive BayesFlow story. Regeneration and model details are in `scripts/bayesflow-demo/README.md`; Python is not needed to build or serve the site.
- `content/demos/superstats-ddm.json` — recorded DDM simulations and trial-wise neural posterior estimates from Superstats. Regeneration, model assumptions, and verification are in `scripts/superstats-demo/README.md`.
- `content/applications.yaml` — legacy project content retained for old project URLs.
- `content/members/*.md` — team members. YAML front matter plus a Markdown bio.
- `content/posts/*.md` — archived post text, retained locally and not published.
- `content/news.md`, `content/news-archive.md` — homepage news, grouped under
  `### Month Year` headings. Each heading becomes a timeline entry.

New Markdown files are picked up automatically; the filename becomes the URL slug.
For example `content/members/jane-doe.md` becomes `/members/jane-doe`.

Papers, awards, and products receive title-based URL slugs automatically. Set an
explicit `slug:` if a shorter or permanent URL is preferred. Their index icons
use the optional `icon:` field (for example, `icon: images/icons/bayesflow.svg`);
generic placeholders are shown until custom icons are supplied.

Member front matter supports `name`, `image`, `role` (`pi`, `postdoc`, `phd`,
`msc`, `undergrad`, `affiliate`, `alumni`), an optional `description` and `institution`, and
a `links` map keyed by the types listed in `src/lib/format.js`.

## Images

Source images live in `assets/images/` at whatever resolution they arrive in.
`scripts/optimize-images.mjs` resizes them and writes WebP into `public/images/`
on every build, which takes the served imagery from roughly 40 MB down to 3 MB.
`assetUrl()` rewrites `.png`/`.jpg` references to `.webp` automatically, so content
files keep referring to `images/members/jane-doe.jpg`.

`public/images/` is generated and gitignored. To add an image, drop it in
`assets/images/` and reference the original filename.

## Updating publications

Add an entry to `content/sources.yaml` with an `id`, plus whatever you want to
say about it — `description`, `image`, `tags`, `buttons`. Then:

```bash
npm run citations
```

`scripts/update-citations.mjs` resolves each id and rewrites
`content/citations.yaml`:

| Id form | Resolved via |
| --- | --- |
| `arXiv:2511.08763` | the arXiv API |
| `10.1037/met0000645` (or `doi:…`) | `doi.org` content negotiation, as CSL-JSON |
| `pubmed:12345678` | NCBI esummary |

It fills in title, authors, publisher, date, and link; every field you wrote in
`sources.yaml` overrides what the registry returned, so you can correct a messy
venue string by just setting `publisher:` there. No API keys are needed.

Results are cached in `.cache/` for 90 days — pass `--force` to re-fetch, and
`--out FILE` to write elsewhere if you want to inspect a diff before committing.
The `update-citations` workflow runs it weekly and opens a pull request.

Two details worth knowing. For arXiv entries the date is the **latest version's**
date, not the v1 submission, so a preprint revised for a conference shows the
year it actually appeared. And when arXiv reports a `journal_ref`, that venue is
used as the publisher instead of "arXiv".

## Deployment

`.github/workflows/deploy.yaml` lints, builds, and publishes `out/` to GitHub
Pages on every push to `main`. `public/CNAME` holds the custom domain and
`public/.nojekyll` stops Pages from trying to process the `_next/` directory.

Because the export is static with `trailingSlash: true`, any static host works —
each route is a real `index.html`, so no SPA fallback or rewrite rule is needed.
`404.html` is served for unknown paths and offers a site-wide search.

## Analytics and search-console verification

The Jekyll site had empty `analytics.html` and `verification.html` includes for
these. Their equivalent is `src/app/layout.jsx`: add a tracking script to the
`<body>`, and a console token via the `verification` key on the exported
`metadata` object.

## Routes

`/` · `/research` · `/research/:slug` · `/products` · `/products/:slug` ·
`/team` · `/members/:slug` · `/news` · `/contact`

Plus `sitemap.xml` and `robots.txt`.

The former `/projects` and `/apps` collection routes remain available for link
compatibility, but they are omitted from the main navigation and sitemap.
