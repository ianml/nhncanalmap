import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deployment } from './deployment.mjs';
import { stripBase, withBase } from '../src/lib/paths.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = deployment();
const dist = join(root, config.outDir);
const scoped = path => withBase(path, config.base, config.directoryUrls);
const absolute = path => new URL(scoped(path), config.site).href;
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(join(directory, entry.name)) : join(directory, entry.name)))).flat();
}
async function exists(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

const expected = [
  'index.html', '404.html', 'about/index.html', 'sources/index.html',
  'beta/index.html', 'beta/map/index.html', 'map/index.html',
  'blog/index.html',
];
for (const path of expected) assert(await exists(join(dist, path)), `Missing route: ${path}`);

// All copied town pages must have a built route and retain their title.
for (const file of await files(join(root, 'src/pages/towns'))) {
  const name = relative(join(root, 'src/pages/towns'), file).replace(/\.md$/, '');
  const output = join(dist, 'towns', name === 'index' ? '' : name, 'index.html');
  const source = await readFile(file, 'utf8');
  const html = await readFile(output, 'utf8');
  const heading = source.match(/^# (.+)$/m)?.[1];
  const escapedHeading = heading?.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  assert(escapedHeading && html.includes(escapedHeading), `Missing town content: ${name}`);
}

let checkedLinks = 0;
const builtFiles = await files(dist);
// The published site must survive retiring the old domain and all subdomains.
for (const file of builtFiles.filter(file => /\.(?:html|css|m?js|json|geojson|xml|txt|svg|webmanifest)$/.test(file) || ['_headers', '_redirects'].includes(relative(dist, file)))) {
  assert(!/nhncanal\.org/i.test(await readFile(file, 'utf8')), `Retired domain dependency in ${relative(dist, file)}`);
}
const htmlFiles = builtFiles.filter(file => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const mainNav = html.match(/<nav\b[^>]*aria-label="Main navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  if (mainNav) {
    assert(!mainNav.includes(`href="${scoped('/blog')}"`), 'Blog must be hidden from the navbar');
    assert(mainNav.includes(`href="${scoped('/about')}"`), 'About must remain in the navbar');
  }
  for (const guide of ['/farmington-canal', '/hampshire-and-hampden-canal']) {
    assert(!html.includes(`href="${scoped(guide)}"`), `Hidden guide link in ${relative(dist, file)}`);
  }
  // Check quoted local links and assets in the generated static HTML.
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const href = match[1];
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) continue;
    const pathname = decodeURIComponent(href.split(/[?#]/)[0]);
    if (!pathname) continue;
    if (pathname.startsWith('/')) assert.equal(pathname, scoped(stripBase(pathname, config.base)), `Unscoped local URL: ${href}`);
    const target = pathname.startsWith('/') ? resolve(dist, `.${stripBase(pathname, config.base)}`) : resolve(dirname(file), pathname);
    assert(await exists(target) || await exists(join(target, 'index.html')), `Broken local link in ${relative(dist, file)}: ${href}`);
    checkedLinks++;
  }
  if (!file.includes(`${join('beta', 'map')}/`) && !html.includes('http-equiv="refresh"')) {
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `Expected one page heading: ${file}`);
    assert(html.includes('id="main"'), `Missing skip-link target: ${file}`);
    assert(!html.includes('astro-island'), `Unexpected hydrated framework component: ${file}`);
    assert(!html.includes(':::tip') && !html.includes(':::caution'), `Unconverted admonition: ${file}`);
  }
}

// Preserve every byte of the standalone beta map, including the range-read archives.
for (const file of await files(join(root, 'public/beta/map'))) {
  const output = join(dist, relative(join(root, 'public'), file));
  assert((await readFile(file)).equals(await readFile(output)), `Changed or missing map asset: ${file}`);
}
const home = await readFile(join(dist, 'index.html'), 'utf8');
assert(home.includes('3938e2b4321d41879d64de09d1238864'), 'Missing ArcGIS map');
const beta = await readFile(join(dist, 'beta/index.html'), 'utf8');
assert(beta.includes(`src="${scoped('/beta/map/index.html')}"`), 'Missing beta iframe');
const mapRedirect = await readFile(join(dist, 'map/index.html'), 'utf8');
assert(/http-equiv="refresh"/.test(mapRedirect), 'Missing static map redirect');
if (config.github) {
  assert(await exists(join(dist, '.nojekyll')), 'GitHub output must bypass Jekyll');
  assert(!await exists(join(dist, '_headers')) && !await exists(join(dist, '_redirects')), 'Cloudflare config in GitHub output');
} else {
  const redirects = await readFile(join(dist, '_redirects'), 'utf8');
  assert(!redirects.includes('/* /index.html 200'), 'Docusaurus SPA fallback must not mask static 404s');
  assert((await readFile(join(root, 'public/_headers'))).equals(await readFile(join(dist, '_headers'))));
}
for (const route of ['archive', 'tags', 'tags/lidar', 'tags/gis', 'tags/historical-maps', 'tags/mapping', 'tags/elevation-models']) {
  const html = await readFile(join(dist, 'blog', route, 'index.html'), 'utf8');
  assert(/http-equiv="refresh"/.test(html) && html.includes(scoped('/blog')), `Missing retired blog route redirect: ${route}`);
}

// The sitemap must advertise real canonical pages, never drafts, redirects, or errors.
const sitemapIndex = await readFile(join(dist, 'sitemap-index.xml'), 'utf8');
assert(sitemapIndex.includes(absolute('/sitemap-0.xml')), 'Missing target sitemap');
const sitemap = await readFile(join(dist, 'sitemap-0.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'Duplicate sitemap URLs');
for (const url of sitemapUrls) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, config.site);
  const route = stripBase(parsed.pathname, config.base).replace(/\/$/, '') || '/';
  assert(!['/map', '/404', '/404.html', '/blog/building-the-canal-map', '/blog/downloading-dems', '/blog/archive'].includes(route), `Noncanonical or unpublished sitemap URL: ${url}`);
  assert(!route.startsWith('/blog/tags'), `Retired tag in sitemap: ${url}`);
  const page = await readFile(join(dist, route.slice(1), 'index.html'), 'utf8');
  assert(page.includes(`rel="canonical" href="${url}"`), `Sitemap/canonical mismatch: ${url}`);
}
for (const route of ['/farmington-canal', '/hampshire-and-hampden-canal']) {
  assert(!sitemapUrls.includes(absolute(route)), `Hidden guide in sitemap: ${route}`);
  assert(!await exists(join(dist, route.slice(1), 'index.html')), `Hidden guide was published: ${route}`);
}
assert(!await exists(join(dist, 'blog/downloading-dems/index.html')), 'Draft post must remain unpublished');
assert((await readFile(join(dist, 'robots.txt'), 'utf8')).includes(`Sitemap: ${absolute('/sitemap-index.xml')}`));
assert(home.includes('<title>Map of the New Haven &amp; Northampton Canal</title>'), 'Missing homepage SEO title');
console.log(`Verified ${htmlFiles.length} HTML files, ${checkedLinks} local links, ${sitemapUrls.length} canonical sitemap URLs, town content, redirects, and all beta map assets.`);
