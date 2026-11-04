import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceUrl } from '../site/src/source-link.js';

test('links repository paths to the deployed commit', () => {
  assert.equal(sourceUrl('plugins/a/agents/review.md','a'.repeat(40)),`https://github.com/Artyem-Y/ai-marketplace/blob/${'a'.repeat(40)}/plugins/a/agents/review.md`);
});
test('rejects unsafe paths and avoids untrusted commit values', () => {
  assert.equal(sourceUrl('../secrets','a'.repeat(40)),null);
  assert.equal(sourceUrl('plugins/a/../secrets','a'.repeat(40)),null);
  assert.equal(sourceUrl('plugins/a/review.md','main?x'),null);
});
