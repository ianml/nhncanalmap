import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';
import { withBase } from '../src/lib/paths.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? htmlFiles(join(directory, entry.name)) : entry.name.endsWith('.html') ? [join(directory, entry.name)] : []))).flat();
}
function checked(result) {
  if (result.errors?.length) throw new Error(result.errors.join('\n'));
  return result;
}

export async function buildSearch(dist, { base = '/', directoryUrls = false } = {}) {
  const sources = JSON.parse(await readFile(join(root, 'src/data/sources.json'), 'utf8'));
  const records = [];
  const { index } = checked(await pagefind.createIndex({
    rootSelector: 'main', forceLanguage: 'en',
    excludeSelectors: ['nav', '.town-nav', 'iframe', 'button', 'script', 'style', '[data-pagefind-ignore]'],
  }));
  if (!index) throw new Error('Unable to create search index');
  let websitePages = 0;
  try {
    for (const file of await htmlFiles(dist)) {
      const content = await readFile(file, 'utf8');
      const path = relative(dist, file).replaceAll('\\', '/');
      if (path === '404.html' || path.startsWith('beta/map/') || !content.includes('id="main"') || /http-equiv="refresh"/.test(content)) continue;
      const url = withBase('/' + path.replace(/(?:\/)?index\.html$/, ''), base, directoryUrls);
      // Explicit canonical URLs, indexed body only, and a filter shared with PDFs.
      checked(await index.addHTMLFile({ url, content: content.replace('id="main"', 'id="main" data-pagefind-filter="kind:Website"') }));
      websitePages++;
    }
    for (const source of sources.filter(source => source.pdf)) {
      let cached;
      try {
        cached = JSON.parse(await readFile(join(root, 'search/documents', `${source.id}.json`), 'utf8'));
      } catch {
        throw new Error(`Missing document cache for ${source.id}. Run npm run search:refresh before building.`);
      }
      if (cached.schema !== 1 || cached.url !== source.url || cached.pageCount !== cached.pages.length) {
        throw new Error(`Invalid or stale document cache for ${source.id}; refresh this source.`);
      }
      let indexedPages = 0;
      for (const page of cached.pages) {
        if (!page.text.trim()) continue;
        checked(await index.addCustomRecord({
          url: `${source.url}#page=${page.page}`, language: 'en', content: page.text,
          meta: { title: source.title, author: source.author, year: source.year,
            document: source.id, page: String(page.page), method: page.method },
          filters: { kind: ['Documents'], document: [source.id], canal: source.canals },
        }));
        indexedPages++;
      }
      records.push({ id: source.id, title: source.title, author: source.author,
        year: source.year, url: source.url, size: source.size,
        pageCount: cached.pageCount, indexedPages, lowTextPages: cached.lowTextPages });
    }
    const output = join(dist, 'pagefind');
    await mkdir(output, { recursive: true });
    checked(await index.writeFiles({ outputPath: output }));
    await writeFile(join(output, 'documents.json'), JSON.stringify({ websitePages, documents: records }));
    console.log(`Search: ${websitePages} website pages and ${records.reduce((n, d) => n + d.indexedPages, 0)} PDF pages from ${records.length} documents.`);
  } finally {
    await pagefind.close();
  }
}
