import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChange } from '../scripts/check-plugin-versions.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const prior = { portable:'0.1.0', claude:'0.1.0' };
test('plugin runtime changes require a newer matching version and changelog', () => {
  const change = { name:'example', prior, current:{portable:'0.1.0',claude:'0.1.0'}, changedPaths:['plugins/example/skills/check/SKILL.md'] };
  assert.match(validateChange(change).join(' '), /increase/i);
  change.current = {portable:'0.1.1',claude:'0.1.1'};
  assert.match(validateChange(change).join(' '), /changelog/i);
  change.changedPaths.push('plugins/example/CHANGELOG.md');
  assert.deepEqual(validateChange(change), []);
});

test('documentation-only changes need no version bump', () => {
  assert.deepEqual(validateChange({name:'example',prior,current:prior,changedPaths:['plugins/example/README.md']}), []);
});

test('supporting files in arbitrary directories also require a version bump', () => {
  assert.match(validateChange({name:'example',prior,current:prior,changedPaths:['plugins/example/references/guide.md']}).join(' '), /increase/i);
});

test('mismatched and downgraded manifests fail', () => {
  const changedPaths=['plugins/example/agents/check.md','plugins/example/CHANGELOG.md'];
  assert.match(validateChange({name:'example',prior,current:{portable:'0.1.1',claude:'0.1.2'},changedPaths}).join(' '), /match/i);
  assert.match(validateChange({name:'example',prior:{portable:'0.2.0',claude:'0.2.0'},current:prior,changedPaths}).join(' '), /increase/i);
});

test('CLI compares committed plugin changes to the PR base', t => {
  const dir = mkdtempSync(join(tmpdir(), 'plugin-policy-'));
  t.after(() => rmSync(dir, {recursive:true, force:true}));
  const git = (...args) => execFileSync('git', ['-C', dir, ...args], {encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init'); git('config','user.name','Test'); git('config','user.email','test@example.invalid');
  mkdirSync(join(dir,'plugins/example/.claude-plugin'), {recursive:true});
  mkdirSync(join(dir,'plugins/example/skills/check'), {recursive:true});
  const manifest = version => JSON.stringify({name:'example',version});
  const write = (p, text) => writeFileSync(join(dir,p),text);
  write('plugins/example/plugin.json',manifest('0.1.0'));
  write('plugins/example/.claude-plugin/plugin.json',manifest('0.1.0'));
  write('plugins/example/CHANGELOG.md','Initial\n');
  write('plugins/example/skills/check/SKILL.md','Initial\n');
  git('add','.'); git('commit','-m','initial'); const base = git('rev-parse','HEAD');
  write('plugins/example/skills/check/SKILL.md','Changed\n'); git('add','.'); git('commit','-m','change');
  const script = fileURLToPath(new URL('../scripts/check-plugin-versions.mjs',import.meta.url));
  const check = () => spawnSync(process.execPath,[script,base],{cwd:dir,encoding:'utf8'});
  assert.notEqual(check().status,0);
  write('plugins/example/plugin.json',manifest('0.1.1')); write('plugins/example/.claude-plugin/plugin.json',manifest('0.1.1')); write('plugins/example/CHANGELOG.md','Initial\nUpdated\n');
  git('add','.'); git('commit','-m','version');
  assert.equal(check().status,0,check().stderr);
});
