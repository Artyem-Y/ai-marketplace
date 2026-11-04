import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const stableVersion = version => typeof version === 'string' && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version);
const greater = (a, b) => {
  const left = a.split('.').map(BigInt), right = b.split('.').map(BigInt);
  for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return left[i] > right[i];
  return false;
};

export function validateChange({name, prior, current, changedPaths}) {
  const errors = [];
  if (!stableVersion(current.portable) || !stableVersion(current.claude)) errors.push(`${name}: both manifests must use a stable MAJOR.MINOR.PATCH version`);
  if (current.portable !== current.claude) errors.push(`${name}: portable and Claude versions must match`);
  const prefix = `plugins/${name}/`;
  const runtimeChanged = changedPaths.some(file => {
    if (!file.startsWith(prefix)) return false;
    const relative = file.slice(prefix.length);
    return !['README.md', 'CHANGELOG.md', 'SOURCES.md'].includes(relative);
  });
  if (prior && runtimeChanged) {
    if (!stableVersion(prior.portable) || !stableVersion(prior.claude)) errors.push(`${name}: base versions are invalid`);
    else if (!stableVersion(current.portable) || !greater(current.portable, prior.portable)) errors.push(`${name}: increase the plugin version when runtime content changes`);
    if (!changedPaths.includes(`${prefix}CHANGELOG.md`)) errors.push(`${name}: update the changelog when runtime content changes`);
  }
  return errors;
}

function main(base) {
  if (!/^[a-f0-9]{40}$/i.test(base ?? '')) throw new Error('Supply the full pull request base commit SHA');
  const git = (...args) => execFileSync('git', args, {encoding:'utf8', stdio:['ignore','pipe','pipe']});
  const changedPaths = git('diff', '--name-only', '--no-renames', '-z', `${base}...HEAD`, '--', 'plugins/').split('\0').filter(Boolean);
  const names = [...new Set(changedPaths.map(p => p.match(/^plugins\/([a-z0-9]+(?:-[a-z0-9]+)*)\//)?.[1]).filter(Boolean))];
  const errors = [];
  for (const name of names) {
    const portablePath = `plugins/${name}/plugin.json`, claudePath = `plugins/${name}/.claude-plugin/plugin.json`;
    const readCurrent = file => JSON.parse(readFileSync(file, 'utf8')).version;
    const hasPrior = git('ls-tree', '--name-only', base, '--', portablePath).trim() !== '';
    const readPrior = file => JSON.parse(git('show', `${base}:${file}`)).version;
    const prior = hasPrior ? {portable:readPrior(portablePath), claude:readPrior(claudePath)} : null;
    const current = {portable:readCurrent(portablePath), claude:readCurrent(claudePath)};
    errors.push(...validateChange({name, prior, current, changedPaths}));
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Plugin version policy passed for ${names.length} changed plugin(s).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv[2]); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
