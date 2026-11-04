import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildIndex } from '../scripts/build-index.mjs';
import { searchCatalog } from '../site/src/catalog.js';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'marketplace-index-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, '.claude-plugin'), { recursive: true });
  await mkdir(join(root, 'plugins/example/.claude-plugin'), { recursive: true });
  await mkdir(join(root, 'plugins/example/skills/review'), { recursive: true });
  await writeFile(join(root, '.claude-plugin/marketplace.json'), JSON.stringify({ name: 'example', owner: { name: 'Team' }, plugins: [{ name: 'example', source: './plugins/example' }] }));
  await writeFile(join(root, 'plugins/example/.claude-plugin/plugin.json'), JSON.stringify({ name: 'example', version: '1.0.0', description: 'Example plugin' }));
  await writeFile(join(root, 'plugins/example/skills/review/SKILL.md'), '---\nname: review\ndescription: Review changes\n---\n\nFind an API regression.\n');
  return root;
}

test('indexes declared plugin and skill text but not unrelated files', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'plugins/example/private.txt'), 'do-not-publish');
  const index = await buildIndex(root);
  assert.deepEqual(index.items.map(x => x.id), ['plugin:example', 'skill:example/review']);
  assert.match(index.items[1].body, /API regression/);
  assert.doesNotMatch(JSON.stringify(index), /do-not-publish/);
  assert.deepEqual(index.items[0].children, ['skill:example/review']);
  assert.equal(index.items[1].plugin, 'example');
});

test('rejects a plugin source outside the plugins directory', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, '.claude-plugin/marketplace.json'), JSON.stringify({ name:'example', plugins:[{name:'example',source:'../outside'}] }));
  await assert.rejects(buildIndex(root), /source/i);
});

test('rejects symlinked skill files', async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, 'plugins/example/skills/linked'));
  await symlink(join(root, 'plugins/example/skills/review/SKILL.md'), join(root, 'plugins/example/skills/linked/SKILL.md'));
  await assert.rejects(buildIndex(root), /symlink/i);
});

test('reads the Codex catalog when the Claude catalog does not exist', async (t) => {
  const root = await fixture(t);
  await rm(join(root, '.claude-plugin'), { recursive: true });
  await mkdir(join(root, '.agents/plugins'), { recursive: true });
  await writeFile(join(root, '.agents/plugins/marketplace.json'), JSON.stringify({name:'example', plugins:[{name:'example',source:{source:'local',path:'./plugins/example'}}]}));
  const index = await buildIndex(root);
  assert.equal(index.items[0].name, 'example');
  assert.equal(index.items.length, 2);
});

test('rejects an unsupported remote source rather than silently omitting it', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, '.claude-plugin/marketplace.json'), JSON.stringify({name:'example',plugins:[{name:'example',source:{source:'github',repo:'owner/repo'}}]}));
  await assert.rejects(buildIndex(root), /source/i);
});

test('groups matches from allowed supporting documents under one skill with source paths', async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, 'plugins/example/skills/review/rules'));
  await writeFile(join(root, 'plugins/example/skills/review/rules/one.md'), 'unique-orchid first guidance');
  await writeFile(join(root, 'plugins/example/skills/review/rules/two.md'), 'unique-orchid second guidance');
  await writeFile(join(root, 'plugins/example/skills/review/rules/secret.txt'), 'do-not-publish');
  const index = await buildIndex(root);
  const result = searchCatalog(index.items, 'unique-orchid');
  assert.equal(result.length, 1);
  assert.equal(result[0].item.id, 'skill:example/review');
  assert.deepEqual(result[0].matches.map(match => match.path), ['plugins/example/skills/review/rules/one.md', 'plugins/example/skills/review/rules/two.md']);
  assert.doesNotMatch(JSON.stringify(index), /do-not-publish/);
});

test('rejects symlinked supporting markdown', async (t) => {
  const root = await fixture(t);
  await symlink(join(root, 'plugins/example/skills/review/SKILL.md'), join(root, 'plugins/example/skills/review/example.md'));
  await assert.rejects(buildIndex(root), /symlink/i);
});

test('indexes declared agent tools and model without inferring permissions', async t => {
  const root = await fixture(t);
  await mkdir(join(root,'plugins/example/agents'));
  await writeFile(join(root,'plugins/example/agents/reviewer.md'), '---\nname: reviewer\ndescription: Review changes\ntools: Read, Grep, Glob\nmodel: inherit\n---\nReview carefully.');
  const agent = (await buildIndex(root)).items.find(item => item.type === 'agent');
  assert.deepEqual(agent.tools,['Read','Grep','Glob']);
  assert.equal(agent.model,'inherit');
});
