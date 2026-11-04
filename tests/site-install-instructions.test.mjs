import test from 'node:test';
import assert from 'node:assert/strict';
import { instructionsFor } from '../site/src/install-instructions.js';
import { readFile } from 'node:fs/promises';

test('plugin and its skill receive the same reviewed Codex installation commands', () => {
  const plugin = instructionsFor({type:'plugin',name:'research-tools',id:'plugin:research-tools'});
  const skill = instructionsFor({type:'skill',plugin:'research-tools',id:'skill:research-tools/researcher'});
  assert.deepEqual(skill, plugin);
  assert.equal(plugin.commands[0], 'codex plugin marketplace add Artyem-Y/ai-marketplace --ref main');
  assert.equal(plugin.commands.at(-1), 'codex plugin add research-tools@ai-marketplace');
  assert.deepEqual(plugin.projectCommands, ['npx --yes github:Artyem-Y/ai-marketplace add research-tools --project']);
});

test('SDD commands include each required plugin without claiming automatic dependencies', () => {
  const result = instructionsFor({type:'agent',plugin:'sdd-engineering',id:'agent:sdd-engineering/spec-creator'});
  assert.equal(result.commands.length, 5);
  assert.ok(result.commands.includes('codex plugin add architecture-review@ai-marketplace'));
});

test('unknown or malformed artifact metadata cannot become a shell command', () => {
  assert.equal(instructionsFor({type:'plugin',name:'research-tools;echo bad',id:'plugin:research-tools;echo bad'}), null);
  assert.equal(instructionsFor({type:'skill',plugin:'research-tools',id:'skill:other/researcher'}), null);
});

test('reviewed commands cover the dependencies declared by each current plugin', async () => {
  const root = new URL('../',import.meta.url);
  const read = async file => JSON.parse(await readFile(new URL(file,root),'utf8'));
  const marketplace = await read('.claude-plugin/marketplace.json');
  for (const {name} of marketplace.plugins) {
    const result = instructionsFor({type:'plugin',name,id:`plugin:${name}`});
    assert.ok(result, `Review installation instructions for ${name}`);
    const manifest = await read(`plugins/${name}/.claude-plugin/plugin.json`);
    for (const dependency of manifest.dependencies ?? []) {
      const dependencyName = typeof dependency === 'string' ? dependency : dependency.name;
      assert.ok(result.commands.includes(`codex plugin add ${dependencyName}@ai-marketplace`), `Missing dependency ${dependencyName} for ${name}`);
    }
  }
});
