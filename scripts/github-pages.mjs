import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const [command = 'build', ...args] = process.argv.slice(2);
if (!['build', 'preview', 'test'].includes(command)) throw new Error('Expected build, preview, or test');
const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env, DEPLOY_TARGET: 'github' };
function run(script, ...args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const astro = JSON.parse(readFileSync(new URL('../node_modules/astro/package.json', import.meta.url), 'utf8'));
if (command === 'preview') run('scripts/preview-github.mjs', ...args);
else run(`node_modules/astro/${astro.bin.astro}`, command === 'test' ? 'build' : command, ...args);
if (command === 'test') {
  run('scripts/verify-build.mjs');
  run('scripts/verify-search.mjs');
}
