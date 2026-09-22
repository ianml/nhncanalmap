import { defineMiddleware } from 'astro:middleware';
import { scopeHtml } from '../scripts/html-paths.mjs';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const base = import.meta.env.BASE_URL;
  const directoryUrls = import.meta.env.PUBLIC_DIRECTORY_URLS === 'true';
  if ((base === '/' && !directoryUrls) || !response.headers.get('content-type')?.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(scopeHtml(await response.text(), base, directoryUrls), { status: response.status, headers });
});
