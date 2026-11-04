import test from 'node:test';
import assert from 'node:assert/strict';
import { messages } from '../site/src/messages.js';

test('English catalog messages include dynamic accessibility and result labels', () => {
  assert.equal(messages.searchCatalog, 'Search the catalog');
  assert.equal(messages.resultCount(2), '2 results');
  assert.equal(messages.switchTheme('light'), 'Switch to light theme');
  assert.equal(messages.matchFile('example.md'), 'Match file: example.md');
});
