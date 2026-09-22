import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { deployment } from './deployment.mjs';
import { stripBase, withBase } from '../src/lib/paths.mjs';

const root = new URL('../', import.meta.url);
const config = deployment();
const scoped = path => withBase(path, config.base, config.directoryUrls);
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const catalogue = await json('src/data/sources.json');
assert.equal(new Set(catalogue.map(source => source.id)).size, catalogue.length, 'Duplicate source IDs');
const summary = await json(`${config.outDir}/pagefind/documents.json`);
const pdfs = catalogue.filter(source => source.pdf);
assert.equal(summary.documents.length, pdfs.length, 'Missing source in search catalogue');

// Check the actual emitted records, not just the build's reported counts.
// Pagefind 1.x fragments are gzip JSON with a pagefind_dcd signature.
const fragments = new URL(`${config.outDir}/pagefind/fragment/`, root);
const records = await Promise.all((await readdir(fragments)).map(async file => {
  const fragment = gunzipSync(await readFile(new URL(file, fragments))).toString();
  assert(fragment.startsWith('pagefind_dcd'), 'Unrecognized Pagefind fragment format');
  return JSON.parse(fragment.slice('pagefind_dcd'.length));
}));
assert.equal(new Set(records.map(record => record.url)).size, records.length, 'Duplicate search URLs');
assert(!/nhncanal\.org/i.test(JSON.stringify(records)), 'Retired domain leaked into search records');
const website = records.filter(record => record.filters.kind?.includes('Website'));
assert.equal(website.length, summary.websitePages);
assert(website.some(record => record.url === scoped('/about')), 'About must remain searchable');
assert(!website.some(record => ['/farmington-canal', '/hampshire-and-hampden-canal'].some(route => record.url === scoped(route))), 'Hidden guide in search');
assert(website.some(record => record.url === scoped('/towns/southwick') && /Congamond/.test(record.content)));
for (const record of website) {
  const route = stripBase(record.url, config.base).replace(/\/$/, '') || '/';
  assert.equal(record.url, scoped(route), 'Search result has the wrong deployment path');
  assert(!/downloading-dems|404|building-the-canal-map|^\/map$|^\/beta\/map|^\/blog\/(tags|archive)/.test(route), `Unpublished/duplicate search result: ${record.url}`);
  assert(!/Switch to dark mode|Enter a town, a landmark|Show more matching pages/.test(record.content), 'UI text leaked into the index');
}
let pages = 0;
for (const source of pdfs) {
  const cached = await json(`search/documents/${source.id}.json`);
  assert.equal(cached.url, source.url);
  assert.equal(cached.pageCount, cached.pages.length);
  assert.deepEqual(cached.pages.map(page => page.page), Array.from({ length: cached.pageCount }, (_, i) => i + 1), 'Lost PDF page numbering');
  const matching = records.filter(record => record.meta.document === source.id);
  const extracted = cached.pages.filter(page => page.text.trim());
  assert.equal(matching.length, extracted.length, `Missing indexed text for ${source.id}`);
  assert.equal(summary.documents.find(doc => doc.id === source.id).indexedPages, matching.length);
  for (const record of matching) {
    const page = cached.pages[Number(record.meta.page) - 1];
    assert(page);
    assert.equal(record.url, `${source.url}#page=${page.page}`, 'PDF page link mismatch');
    assert.equal(record.content, page.text, 'Indexed PDF text differs from extraction');
    assert.equal(record.meta.title, source.title);
    assert.equal(record.meta.author, source.author);
    assert.equal(record.meta.year, source.year);
    assert.deepEqual(record.filters.kind, ['Documents']);
  }
  pages += matching.length;
}
assert.equal(records.length, pages + website.length, 'Unexpected records in search');

console.log(`Verified search: ${website.length} published site pages, ${pdfs.length} PDFs, ${pages} indexed PDF pages, page links, OCR, and draft exclusion.`);
