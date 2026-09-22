import { readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSearch } from './build-search.mjs';
import { withBase } from '../src/lib/paths.mjs';
import { scopeHtml } from './html-paths.mjs';

export default function searchIntegration(target) {
  return {
    name: 'canal-search',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const dist = fileURLToPath(dir);
        // Astro's generated redirect stubs do not use the site's middleware.
        async function scopeRedirects(directory) {
          for (const entry of await readdir(directory, { withFileTypes: true })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) await scopeRedirects(path);
            else if (entry.name.endsWith('.html')) {
              const html = await readFile(path, 'utf8');
              if (/http-equiv="refresh"/.test(html)) await writeFile(path, scopeHtml(html, target.base, target.directoryUrls, target.site));
            }
          }
        }
        if (target.github) {
          await scopeRedirects(dist);
          await writeFile(join(dist, '.nojekyll'), '');
          await Promise.all(['_headers', '_redirects'].map(file => rm(join(dist, file), { force: true })));
        }
        const sitemap = new URL(withBase('/sitemap-index.xml', target.base), target.site);
        await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`);
        await buildSearch(dist, target);
      },
      'astro:config:setup': ({ updateConfig }) => updateConfig({
        vite: { plugins: [{
          name: 'serve-built-search-in-dev',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              const pathname = req.url?.split('?')[0] ?? '';
              const prefix = withBase('/pagefind/', target.base);
              if (!pathname.startsWith(prefix) || !/^[a-zA-Z0-9_./-]+$/.test(pathname) || pathname.includes('..')) return next();
              try {
                const bytes = await readFile(new URL(`../${target.outDir}/pagefind/${pathname.slice(prefix.length)}`, import.meta.url));
                res.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.json') ? 'application/json' : 'application/octet-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.end(bytes);
              } catch { next(); }
            });
          },
        }] },
      }),
    },
  };
}
