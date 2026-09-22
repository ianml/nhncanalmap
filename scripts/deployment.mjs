export function deployment(env = process.env) {
  const github = env.DEPLOY_TARGET === 'github';
  if (env.DEPLOY_TARGET && !['github', 'cloudflare'].includes(env.DEPLOY_TARGET)) throw new Error('DEPLOY_TARGET must be github or cloudflare');
  const repositoryName = env.GITHUB_REPOSITORY || 'ianml/nhncanalmap';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repositoryName)) throw new Error('GITHUB_REPOSITORY must be owner/repository');
  const [owner, repository] = repositoryName.split('/');
  const site = env.SITE_URL || (github ? `https://${owner}.github.io` : 'https://nhncanalmap.pages.dev');
  const url = new URL(site);
  if (!['https:', 'http:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be an origin, without a path');
  const requestedBase = env.SITE_BASE ?? (github && repository.toLowerCase() !== `${owner}.github.io`.toLowerCase() ? `/${repository}` : '/');
  if (!/^\/(?:[\w-]+\/)*[\w-]*\/?$/.test(requestedBase) || requestedBase.includes('//')) throw new Error('SITE_BASE must be / or a slash-separated path');
  const base = requestedBase.replace(/\/$/, '') || '/';
  return { github, site: url.origin, base, directoryUrls: github, outDir: github ? 'dist-github' : 'dist' };
}
