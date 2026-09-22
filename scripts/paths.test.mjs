import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBase, stripBase } from '../src/lib/paths.mjs';
import { scopeHtml } from './html-paths.mjs';
import { deployment } from './deployment.mjs';

test('deployment defaults keep Cloudflare independent of the GitHub environment', () => {
  assert.deepEqual(deployment({ GITHUB_REPOSITORY: 'someone/fork' }), {
    github: false, site: 'https://nhncanalmap.pages.dev', base: '/', directoryUrls: false, outDir: 'dist',
  });
  assert.equal(deployment({ DEPLOY_TARGET: 'github', GITHUB_REPOSITORY: 'someone/fork' }).base, '/fork');
  assert.equal(deployment({ DEPLOY_TARGET: 'github', GITHUB_REPOSITORY: 'someone/someone.github.io' }).base, '/');
  assert.equal(deployment({ DEPLOY_TARGET: 'github', SITE_URL: 'https://canal.example', SITE_BASE: '/' }).site, 'https://canal.example');
});

test('paths preserve assets, fragments, external URLs, and an existing prefix', () => {
  for (const url of ['https://docs.example/book.pdf#page=3', '//cdn.example/image.png', '#canal-map', '?view=map']) {
    assert.equal(withBase(url, '/repo', true), url);
  }
  assert.equal(withBase('/towns/avon#history', '/repo', true), '/repo/towns/avon/#history');
  assert.equal(withBase('/beta/map/index.html?view=41,-72,13', '/repo', true), '/repo/beta/map/index.html?view=41,-72,13');
  assert.equal(withBase('/repo/img/logo.png', '/repo', true), '/repo/img/logo.png');
  assert.equal(withBase('/', '/repo', true), '/repo/');
  assert.equal(stripBase('/repository/towns', '/repo'), '/repository/towns');
  assert.equal(stripBase('/repo/', '/repo'), '/');
});

test('HTML scoping covers raw Markdown, noscript, and redirects without modifying code', () => {
  const original = '<!doctype html><html><head><meta http-equiv="refresh" content="0;url=/blog"><link rel="canonical" href="https://example.org/blog/"></head><body><noscript><a href="/beta/map/index.html">Map</a></noscript><img src="/img/map.png"><script>const path = "/unchanged";</script><code>/towns/avon</code></body></html>';
  const scoped = scopeHtml(original, '/repo', true, 'https://example.org');
  assert(scoped.includes('content="0;url=/repo/blog/"'));
  assert(scoped.includes('href="https://example.org/repo/blog/"'));
  assert(scoped.includes('href="/repo/beta/map/index.html"'));
  assert(scoped.includes('src="/repo/img/map.png"'));
  assert(scoped.includes('const path = "/unchanged";'));
  assert(scoped.includes('<code>/towns/avon</code>'));
  assert.equal(scopeHtml(scoped, '/repo', true, 'https://example.org'), scoped);
  assert.equal(scopeHtml(original, '/', false), original);
});
