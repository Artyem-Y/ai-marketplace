import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const text = async path => readFile(new URL(path, root), 'utf8');
const plugins = ['engineering-paved-path', 'research-tools', 'architecture-review', 'sdd-engineering'];

test('marketplace entries and plugin dependency graph are complete and acyclic', async () => {
  const market = await json('.claude-plugin/marketplace.json');
  assert.deepEqual(market.plugins.map(p => p.name).sort(), [...plugins].sort());
  const graph = new Map();
  for (const name of plugins) {
    const entry = market.plugins.find(p => p.name === name);
    assert.equal(entry.source, `./plugins/${name}`);
    const manifest = await json(`plugins/${name}/.claude-plugin/plugin.json`);
    assert.equal(manifest.name, name);
    graph.set(name, (manifest.dependencies ?? []).map(d => typeof d === 'string' ? d : d.name));
  }
  assert.deepEqual(graph.get('sdd-engineering').sort(), ['architecture-review', 'engineering-paved-path', 'research-tools']);
  assert.ok(graph.get('architecture-review').includes('engineering-paved-path'));
  const visit = (name, ancestors = []) => {
    assert.ok(graph.has(name), `Unknown dependency ${name}`);
    assert.ok(!ancestors.includes(name), `Dependency cycle: ${[...ancestors,name].join(' -> ')}`);
    for (const dependency of graph.get(name)) visit(dependency, [...ancestors,name]);
  };
  for (const name of plugins) visit(name);
});

test('every plugin has user-facing documentation and a changelog', async () => {
  for (const name of plugins) {
    assert.match(await text(`plugins/${name}/README.md`), /install/i);
    assert.match(await text(`plugins/${name}/CHANGELOG.md`), /unreleased/i);
  }
});

test('each plugin has a portable Codex manifest and usable skills', async () => {
  for (const name of plugins) {
    const manifest = await json(`plugins/${name}/plugin.json`);
    assert.equal(manifest.name, name);
    assert.equal(manifest.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
    const skill = { 'engineering-paved-path':'architecture-boundaries', 'research-tools':'researcher', 'architecture-review':'architecture-reviewer', 'sdd-engineering':'run-plan' }[name];
    assert.match(await text(`plugins/${name}/skills/${skill}/SKILL.md`), /^---\nname:/);
  }
});

test('portable engineering skills include their referenced supporting documents', async () => {
  const files = [
    'onion-architecture/SKILL.md', 'onion-architecture/references.md', 'onion-architecture/rules/layers.md',
    'react-best-practices/SKILL.md', 'react-best-practices/examples.md',
    'frontend-ui-architecture/SKILL.md', 'frontend-ui-architecture/README.md',
    'react-testing-library/SKILL.md',
    'next-best-practices/SKILL.md', 'next-best-practices/rsc-boundaries.md',
    'fastify-best-practices/SKILL.md', 'fastify-best-practices/rules/authentication.md', 'fastify-best-practices/LICENSE',
  ];
  for (const file of files) {
    const contents = await text(`plugins/engineering-paved-path/skills/${file}`);
    assert.ok(contents.trim().length > 100, file);
    assert.doesNotMatch(contents, /dev.?digest|reviewer-core/i, file);
    assert.doesNotMatch(contents, /\/Users\/[^\s/:]+\/|\/home\/[^\s/:]+\//, file);
  }
});
