/** Strip a deployment prefix for route comparisons, preserving the root path. */
export function stripBase(path, base = '/') {
  const prefix = base.replace(/\/$/, '');
  return prefix && (path === prefix || path.startsWith(`${prefix}/`)) ? path.slice(prefix.length) || '/' : path;
}

/** Scope local URLs only; external URLs, fragments, and queries stay untouched. */
export function withBase(url, base = '/', directoryUrls = false) {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  const split = url.search(/[?#]/);
  const suffix = split < 0 ? '' : url.slice(split);
  let path = stripBase(split < 0 ? url : url.slice(0, split), base);
  if (directoryUrls && !path.endsWith('/') && !path.split('/').pop().includes('.')) path += '/';
  return `${base.replace(/\/$/, '')}${path}${suffix}`;
}
