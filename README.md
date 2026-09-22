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
root with `npm run build` and publish `dist/` (previously Docusaurus used `build/`).
`wrangler.toml` declares the new output directory. For Git-based builds, use the
repository root, `npm run build`, and `dist/`; check any existing dashboard
overrides before deploying. `.node-version` selects Node.js 24 for builds.

With Wrangler v4 installed and authenticated, `npm run deploy` builds and
publishes the site. `npm run preview:pages` runs the built output locally with
Cloudflare's header and redirect rules. The migration itself does not deploy.

### Retiring the old domain

The default production origin is `https://nhncanalmap.pages.dev`. Canonical URLs,
the sitemap, and robots use that origin. Images are bundled under `public/img/`
and served from the site's own paths; the About page's old-domain email contact
has been removed. Build checks reject references to `nhncanal.org` or its
subdomains in published text assets and search records.

On September 22, 2026, the public Pages site still served the Docusaurus build,
including five images from the old image hostname. Their local copies are
already included in Astro. Publish the updated repository with `npm run build`
and output directory `dist` to replace that build. Remove any old `SITE_URL`
build-environment override, or set it to `https://nhncanalmap.pages.dev`.

The site still uses external ArcGIS/Google maps, R2 terrain overlays, public map
tiles, and PDFs at `docs.farmingtoncanal.info`; none uses the retired domain.
This is independence from the old domain, not offline operation. Existing
Cloudflare custom-domain associations, DNS, and dashboard redirects are separate
from the repository and have not been changed.

### Optional GitHub Pages deployment

Cloudflare Pages remains the default (`npm run build`, `dist/`, `nhncanalmap.pages.dev`).
GitHub Pages has separate build and preview commands; no domain or Cloudflare
project settings need to change:

```sh
npm run test:github
npm run preview:github
```

The GitHub build goes to `dist-github/`. For this repository it defaults to
`https://ianml.github.io/nhncanalmap/`, with a local preview at
`http://127.0.0.1:4322/nhncanalmap/`. `npm run build:github` builds without running
verification. Both targets include the same site content, PDF search, images,
and standalone map assets. They can be built and hosted independently.
The GitHub preview runs a separate local static server, so an existing Astro
preview can stay open on port 4321. Stop it with Ctrl+C when finished.

The optional `.github/workflows/github-pages.yml` workflow runs **only when
manually dispatched**, not on pushes. To use it later:

1. Commit and push the site and workflow, including `search/documents/`.
2. In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
3. In **Actions**, run **Deploy to GitHub Pages (optional)**.

The workflow reads the site's origin and base path from `actions/configure-pages`,
builds and verifies the output, and deploys the artifact with GitHub's Pages
actions. It does not publish to Cloudflare or change DNS. No deployment has been
performed as part of adding compatibility.

`scripts/deployment.mjs` also accepts `SITE_URL` (origin only) and `SITE_BASE` for
local tests or a GitHub custom domain. For example:

```sh
SITE_URL=https://canal.example SITE_BASE=/ npm run test:github
```

Pass the same settings to `preview:github`. Without overrides, GitHub commands
derive the owner/repository from `GITHUB_REPOSITORY`, falling back to this repo;
`owner/owner.github.io` uses `/`. `DEPLOY_TARGET=github` selects the GitHub target
internally; ordinary Cloudflare builds do not infer the target from GitHub's CI
environment.

Internal URLs in content can stay root-relative. `src/middleware.ts` scopes
rendered HTML (including Markdown and no-JavaScript links) to the build's base.
Browser code uses `sitePath()` for fetched resources. Navigation, canonicals,
redirect stubs, sitemap URLs, robots, and Pagefind records share the target's
path convention. GitHub uses trailing slashes for directory pages and includes
`.nojekyll`. Cloudflare retains its existing URLs and `_headers`/`_redirects`.

GitHub Pages does not apply Cloudflare's header rules or wildcard redirects.
Known retired URLs have static HTML redirects in both builds; arbitrary old
tag URLs receive GitHub's normal 404. For a repository-path site, its packaged
`robots.txt` sits under that path; crawlers consult robots at the hostname root,
so submit the project's sitemap directly if needed. The beta map still uses
its existing external R2 overlays, and ArcGIS/Google maps remain external
services. Custom domains and origin-sensitive services should be checked when
performing the actual deployment.

References: [Astro's GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/)
and [GitHub's Pages workflow](https://github.com/actions/starter-workflows/blob/main/pages/astro.yml).

## Editing

- `src/pages/`: the home and beta map pages, Sources, and plain Markdown town pages.
- `src/drafts/farmington-canal.md` and `src/drafts/hampshire-and-hampden-canal.md`:
  temporarily unpublished canal guides. They have no routes, links, sitemap
  entries, or search results. Move them back into `src/pages/` to restore their
  pages, then restore links and update the visibility checks.
- `src/components/MapEmbed.astro`: shared map activation and scrolling behavior.
- `src/content/blog/`: Markdown blog posts with dates and metadata descriptions.
  The blog lists only titles and dates, without previews, tags, or a separate archive.
  Articles show their publication date without reading-time estimates.
  Set `draft: true` to hide a post from all listings and omit its page from the
  build. Remove the flag or set it to `false` to publish it again.
  `permalink: /about` retains the existing About article's URL; other posts use
  `/blog/<slug>`.
  Blog is hidden from the main navigation; `/blog` and its posts remain available.
  About stays in the main navigation at `/about`.
- `src/layouts/`: shared page layout, town navigation, and blog layouts.
- `src/styles/global.css`: the site's shared responsive styling.
- `src/data/towns.ts`: south-to-north town navigation.
- `public/`: copied images and the complete standalone beta map and datasets.
  `public/img/maps/` includes the original aqueduct image and four source-map
  thumbnails, served locally so the site does not depend on the image hostname.

The site uses Astro and plain Markdown, with no React, Docusaurus, MDX integration,
client router, or UI framework. Town menus use native HTML disclosure controls.
A small script provides a persistent light/dark theme; the maps retain their
existing JavaScript and external services.

Town pages start directly with their historical content. Their frontmatter
descriptions remain available for search engines without being repeated as
visible introductory paragraphs.
Each town has a simple “View on map” link; its breadcrumb names the canal without
linking to the temporarily unpublished guides.
The homepage groups its ArcGIS and Google My Maps links directly above the map.

The beta page's embedded map requires a click or tap to activate. Until then,
scrolling over it scrolls the page. Escape (including from inside the map),
“Done exploring,” or clicking/focusing outside the embed deactivates it again.
The activation button supports keyboard use; the standalone full-screen map
remains immediately interactive.

Guide maps use `?canal=farmington` or `?canal=hampshire-hampden`. Town map links
use `?view=latitude,longitude,zoom`, validated to the canal region before use.
Without these parameters, the full route is shown.

## Search discovery

### On-site search and PDFs

The header magnifying glass (or `⌘K`, `Ctrl+K`, `/`) opens a native search dialog.
The Sources page opens the same dialog. One input searches as you type, with
pages and PDF matches in a single relevance-ranked list. Search runs locally in
the browser using Pagefind. Results have short highlighted excerpts; PDFs show
their file page number. Eight snippets load at a time; “More results” loads the
next batch. PDF links point to the original
host with `#page=N` (file page number, not printed page number). Viewer support
for page fragments varies. No PDF downloads occur in the visitor's browser
until they open a document.

- `src/data/sources.json` is the shared catalogue for `/sources` and PDF indexing.
- `search/documents/*.json` contains **versioned** extracted text, page numbers,
  OCR status, source URL, checksum, ETag, and last-modified metadata. Include
  these files in Git so CI builds work without downloading PDFs or installing OCR.
- `scripts/refresh-documents.py` downloads and extracts changed PDFs. It uses
  Poppler and Tesseract for pages with fewer than 60 alphabetic characters.
  Sparse pages are reported, including blank covers, numeric tables, and maps.
  Existing imperfect text layers may still contain recognition errors.
- `scripts/build-search.mjs` runs after every Astro build. It indexes published
  main content and cached PDF text, excluding navigation, map controls, redirects,
  errors, and the draft DEM post. Missing/mismatched caches fail the build rather
  than silently publishing incomplete document coverage.
- `src/components/Search.astro` provides the accessible, theme-aware interface.

To refresh sources (Python 3.11+, curl, Poppler, and Tesseract required; on macOS
install the latter two with `brew install poppler tesseract`):

```sh
npm run search:refresh
npm run search:refresh -- --id camposeo-1977
npm run search:refresh -- --force
npm test
```

Conditional requests skip unchanged PDFs. Failed downloads/extraction retain
the previous per-document cache and report failure with a nonzero exit code;
ordinary builds continue to use that cache. Inspect and commit changed text
alongside catalogue changes. The original PDFs and QA renders under `.cache/`
are ignored by Git and never deployed. To add an externally hosted PDF, add its
public URL and metadata to the catalogue, refresh, and build. Google Books and
other non-PDF links are covered only by their bibliography text on `/sources`.

`npm run dev` first builds a search snapshot, then serves it alongside live
Astro pages. Rerun `npm run build` after content edits to refresh development
search results. Production builds always regenerate the index. Stable Pagefind
filenames revalidate on deployment via the `/pagefind/*` cache rule.

`npm test` also checks emitted search records against every cached PDF page,
including original-host page links, OCR content, and draft exclusion. The first
collection contains 664 physical PDF pages, 643 with extracted text; 52 pages
use freshly recovered OCR. Blank pages are omitted from the index.

### External search engines

The homepage and town pages have descriptive, canal-specific titles and metadata.
`seoTitle` on `BaseLayout` overrides the default title suffix when a full title is
needed. Town frontmatter keeps the short `title` for navigation, with separate
`description` and `mapView` fields.

Astro's sitemap integration generates `dist/sitemap-index.xml` and its sitemap
from published routes. Redirects and error pages are excluded, and draft blog
posts never generate routes. `public/robots.txt` advertises the production sitemap.

After deployment, submit `https://nhncanalmap.pages.dev/sitemap-index.xml` in the site's
verified Google Search Console property. Record a baseline, then compare clicks,
impressions, and click-through rate for Farmington Canal, Hampshire/Hampden Canal,
and town queries over comparable periods. Sitemap submission and Search Console
account changes are not part of the local build.

The `/map` redirect, `/about`, all town URLs,
`/sources`, `/beta`, and `/beta/map/index.html` are retained. `/blog/building-the-canal-map`
also redirects to `/about`. Retired `/blog/archive` and `/blog/tags` routes redirect to `/blog` and
are excluded from the sitemap and search index. A real 404 replaces the old SPA fallback. The copied
`_headers` and explicit `_redirects` files are included in the static output;
Astro's local preview does not apply host-specific headers or redirect rules,
so generated HTML redirects also work locally.

ArcGIS, basemap tiles, and the beta map's existing hosted overlays still require
an internet connection. The local PMTiles archives require a host that supports
HTTP range requests.

## Migration verification

The migration retains the existing routes except the DEM download post, which
is intentionally marked `draft: true`. `npm test` validates the static output,
internal links, town content, redirects, and beta-map assets. Browser checks
covered the local images, light/dark theme, mobile layout, beta-map activation,
and elevation profile. The preview supports PMTiles range requests and real 404s.

The previous Docusaurus working tree, including uncommitted changes, dependencies,
and its build, is preserved locally in `.migration-backup/docusaurus-2026-09-19/`.
Remaining staging build/cache files are in `.migration-backup/astro-staging/`.
These backups are ignored by Git and excluded from Astro's checks and published
output. All future site edits belong in the root `src/` and `public/` directories.

The local DNS resolver returned the router's private IP for `images.nhncanal.org`.
The original images were retrieved using the hostname's verified public DNS
address, with normal HTTPS certificate validation, and bundled locally. No system
DNS settings were changed. The ArcGIS map also reported a load failure for its
external “Hillshade MA” imagery layer; that service remains unchanged.
