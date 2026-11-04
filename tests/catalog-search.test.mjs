import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCatalog, parseLocation, catalogHash } from '../site/src/catalog.js';

const items = [
  { id: 'skill:a/api-review', type: 'skill', name: 'API review', description: 'Review API contracts', body: 'Check authentication', path: 'plugins/a/skills/api/SKILL.md' },
  { id: 'plugin:b', type: 'plugin', name: 'Toolkit', description: 'Useful toolkit', body: 'API review', path: 'plugins/b/README.md' },
  { id: 'skill:c/tests', type: 'skill', name: 'Test planner', description: 'Plan coverage', body: 'Write tests', path: 'plugins/c/skills/test/SKILL.md' },
];

test('ranks name matches above body matches and ignores common request words', () => {
  const result = searchCatalog(items, 'I need a skill for API review', 'all');
  assert.deepEqual(result.map(x => x.item.id), ['skill:a/api-review', 'plugin:b']);
  assert.equal(result[0].match.path, items[0].path);
});

test('applies type filters and returns no fabricated matches', () => {
  assert.deepEqual(searchCatalog(items, 'API review', 'plugin').map(x => x.item.id), ['plugin:b']);
  assert.deepEqual(searchCatalog(items, 'unrelatedthing', 'all'), []);
});

test('catalog and artifact links round trip safely with filters', () => {
  const state = { query: 'review API', type: 'skill', selected: 'skill:a/api-review' };
  assert.deepEqual(parseLocation(catalogHash(state)), state);
  assert.deepEqual(parseLocation('#?q=test&type=invalid'), {query:'test', type:'all', selected:null});
});

test('navigation pages have shareable links and reject unknown pages', () => {
  const state = { query: 'review', type: 'skill', selected: null, page: 'getting-started' };
  assert.deepEqual(parseLocation(catalogHash(state)), state);
  assert.equal(parseLocation('#?page=unknown').page, undefined);
});
