import { parse, serialize } from 'parse5';
import { withBase } from '../src/lib/paths.mjs';

// Apply the deployment base to both Astro markup and Markdown's raw HTML.
// Script contents are intentionally untouched; browser code uses sitePath().
export function scopeHtml(html, base, directoryUrls, site) {
  if (base === '/' && !directoryUrls) return html;
  const document = parse(html, { scriptingEnabled: false });
  function visit(node) {
    for (const attr of node.attrs ?? []) {
      if (['href', 'src', 'poster', 'action'].includes(attr.name)) attr.value = withBase(attr.value, base, directoryUrls);
      if (site && attr.name === 'href' && node.tagName === 'link' && node.attrs.some(a => a.name === 'rel' && a.value === 'canonical')) {
        const url = new URL(attr.value, site);
        if (url.origin === site) attr.value = new URL(withBase(url.pathname, base, directoryUrls), site).href;
      }
      if (node.tagName === 'meta' && attr.name === 'content' && node.attrs.some(a => a.name === 'http-equiv' && a.value.toLowerCase() === 'refresh')) {
        attr.value = attr.value.replace(/(url=)(\/[^\s]*)/i, (_, prefix, url) => prefix + withBase(url, base, directoryUrls));
      }
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(document);
  return serialize(document);
}
