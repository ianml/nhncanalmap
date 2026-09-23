# New Haven and Northampton Canal

A static Astro site with canal maps, town histories, and mapmaking notes.
The updated Astro site now lives at the repository root and replaces Docusaurus.

## Run locally

Use Node.js 24 (selected by `.node-version`), or another version supported by
`package.json`. From the repository root:

```sh
npm ci
npm run dev
```

Open http://localhost:4321. Astro uses the port printed in the terminal if 4321
is occupied. `npm start` is an alias for the development server.

To check the production output:

```sh
npm test
npm run preview
```

`npm test` runs Astro's type/content checks, builds into `dist/`, and verifies
local links, town routes, redirects, and the standalone map assets. Local
preview serves the built site; `npm run serve` is an alias for it.

## Deployment

The existing Cloudflare Pages project is `nhncanalmap`. Build from the repository
root with `npm run build` and publish `dist/`. `wrangler.toml` declares the output
directory. For Git-based builds, use the repository root, `npm run build`, and `dist/`.

With Wrangler v4 installed and authenticated, `npm run deploy` builds and
publishes the site. `npm run preview:pages` runs the built output locally with
Cloudflare's header and redirect rules.

### Optional GitHub Pages deployment

Cloudflare Pages remains the default (`npm run build`, `dist/`, `nhncanalmap.pages.dev`).
GitHub Pages has separate build and preview commands:

```sh
npm run test:github
npm run preview:github
```

The optional `.github/workflows/github-pages.yml` workflow runs **only when
manually dispatched**, not on pushes. To use it later:

1. Commit and push the site and workflow.
2. In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
3. In **Actions**, run **Deploy to GitHub Pages (optional)**.

## Editing

- `src/pages/`: the home and beta map pages, Sources, and plain Markdown town pages.
- `src/drafts/`: temporarily unpublished canal guides.
- `src/components/MapEmbed.astro`: shared map activation and scrolling behavior.
- `src/content/blog/`: Markdown blog posts with dates and metadata descriptions.
- `src/layouts/`: shared page layout, town navigation, and blog layouts.
- `src/styles/global.css`: the site's shared responsive styling.
- `src/data/towns.ts`: south-to-north town navigation.
- `public/`: copied images and the complete standalone beta map and datasets.

The site uses Astro and plain Markdown, with no React, Docusaurus, MDX integration,
client router, or UI framework.

## Search discovery

The header magnifying glass (or `⌘K`, `Ctrl+K`, `/`) opens a native search dialog.
Search runs locally in the browser using Pagefind. Results have short highlighted
excerpts; PDFs show their file page number.

- `src/data/sources.json` is the shared catalogue for `/sources` and PDF indexing.
- `search/documents/*.json` contains extracted text, page numbers, and OCR status.
- `scripts/refresh-documents.py` downloads and extracts changed PDFs.
- `scripts/build-search.mjs` runs after every Astro build to index content.

To refresh sources (Python 3.11+, curl, Poppler, and Tesseract required):

```sh
npm run search:refresh
npm test
```

`npm run dev` first builds a search snapshot, then serves it alongside live
Astro pages. Rerun `npm run build` after content edits to refresh development
search results. Production builds always regenerate the index.
