import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = resolve(import.meta.dirname, '..');

test('Codex installs local plugins independently into an isolated profile', async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'marketplace-codex-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const env = { ...process.env, CODEX_HOME: home };
  const codex = async (...args) => JSON.parse((await run('codex', args, { env, cwd: root })).stdout);
  const added = await codex('plugin', 'marketplace', 'add', root, '--json');
  assert.equal(added.marketplaceName, 'ai-marketplace');
  const installed = await codex('plugin', 'add', 'sdd-engineering@ai-marketplace', '--json');
  assert.equal(installed.name, 'sdd-engineering');
  assert.match(await readFile(join(installed.installedPath, 'skills/run-plan/SKILL.md'), 'utf8'), /approved/i);
  for (const role of ['spec-creator', 'implementation-planner', 'implementer', 'plan-verifier']) {
    assert.equal(await readFile(join(installed.installedPath, `skills/${role}/SKILL.md`), 'utf8'), await readFile(join(root, `plugins/sdd-engineering/skills/${role}/SKILL.md`), 'utf8'));
    assert.ok((await readFile(join(installed.installedPath, `skills/${role}/references/handoff-protocol.md`), 'utf8')).length > 100);
    assert.match(await readFile(join(installed.installedPath, `agents/${role}.md`), 'utf8'), /^---/);
  }
  const firstList = await codex('plugin', 'list', '--json');
  assert.deepEqual(firstList.installed.map(p => p.name), ['sdd-engineering']);
  for (const name of ['engineering-paved-path', 'research-tools', 'architecture-review']) {
    const plugin = await codex('plugin', 'add', `${name}@ai-marketplace`, '--json');
    assert.equal(plugin.name, name);
    if (name === 'engineering-paved-path') {
      for (const skill of ['onion-architecture', 'react-best-practices', 'frontend-ui-architecture', 'react-testing-library', 'next-best-practices', 'fastify-best-practices']) {
        assert.match(await readFile(join(plugin.installedPath, `skills/${skill}/SKILL.md`), 'utf8'), /^---\nname:/);
      }
      assert.ok((await readFile(join(plugin.installedPath, 'skills/onion-architecture/rules/layers.md'), 'utf8')).length > 100);
    }
  }
  const all = await codex('plugin', 'list', '--json');
  assert.deepEqual(all.installed.map(p => p.name).sort(), ['architecture-review', 'engineering-paved-path', 'research-tools', 'sdd-engineering']);
});
