import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { deployment } from './deployment.mjs';

const { values } = parseArgs({ options: {
  host: { type: 'string', default: '127.0.0.1' },
  port: { type: 'string', default: '4322' },
} });
const { base, outDir } = deployment({ ...process.env, DEPLOY_TARGET: 'github' });
const root = resolve(outDir);
const prefix = base === '/' ? '' : base;
if (!existsSync(resolve(root, 'index.html'))) throw new Error('Run npm run build:github first.');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
};
createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const url = new URL(request.url, 'http://localhost');
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { response.writeHead(400).end(); return; }
    if (prefix && (pathname === '/' || pathname === prefix)) {
      response.writeHead(302, { Location: `${prefix}/${url.search}` }).end();
      return;
    }
    if (prefix && !pathname.startsWith(`${prefix}/`)) {
      response.writeHead(404).end('Not found');
      return;
    }
    let file = resolve(root, `.${pathname.slice(prefix.length)}`);
    if (file !== root && !file.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) {
      if (!pathname.endsWith('/')) {
        response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      }
      file = resolve(file, 'index.html');
      info = await stat(file).catch(() => null);
    }
    let status = 200;
    if (!info?.isFile()) {
      file = resolve(root, '404.html');
      info = await stat(file);
      status = 404;
    }
    const headers = { 'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
    let start = 0;
    let end = info.size - 1;
    // PMTiles reads archive headers and tiles through byte-range requests.
    if (request.headers.range && status === 200) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (range && (range[1] || range[2])) {
        start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
        end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
      }
      if (!range || (!range[1] && !range[2]) || start > end || start >= info.size) {
        response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
        return;
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    response.writeHead(status, headers);
    if (request.method === 'HEAD' || !info.size) response.end();
    else createReadStream(file, { start, end }).on('error', () => response.destroy()).pipe(response);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) response.writeHead(500);
    response.end();
  }
}).listen(Number(values.port), values.host, () => {
  console.log(`GitHub Pages preview: http://${values.host}:${values.port}${prefix}/`);
  console.log('Press Ctrl+C to stop. The Cloudflare preview is unaffected.');
});
