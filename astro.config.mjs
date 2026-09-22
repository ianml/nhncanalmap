import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import searchIntegration from './scripts/search-integration.mjs';
import { deployment } from './scripts/deployment.mjs';
import { stripBase } from './src/lib/paths.mjs';

const target = deployment();

const redirects = {
  '/map': '/',
  '/blog/building-the-canal-map': '/about',
  '/blog/archive': '/blog',
  '/blog/tags': '/blog',
  ...Object.fromEntries(['lidar', 'gis', 'historical-maps', 'mapping', 'elevation-models'].map(tag => [`/blog/tags/${tag}`, '/blog'])),
};

export default defineConfig({
  site: target.site,
  base: target.base,
  outDir: `./${target.outDir}`,
  output: 'static',
  trailingSlash: target.directoryUrls ? 'always' : 'never',
  vite: { define: { 'import.meta.env.PUBLIC_DIRECTORY_URLS': JSON.stringify(String(target.directoryUrls)) } },
  integrations: [searchIntegration(target), sitemap({
    filter: (page) => ![...Object.keys(redirects), '/404', '/404.html'].includes(stripBase(new URL(page).pathname, target.base).replace(/\/$/, '')),
  })],
  redirects,
  devToolbar: { enabled: false },
});
