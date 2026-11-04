import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMetadata } from '../site/scripts/build-metadata.mjs';

test('only accepts a full commit hash and numeric workflow run id', () => {
  const sha = 'a'.repeat(40);
  assert.deepEqual(buildMetadata({GITHUB_SHA:sha, GITHUB_RUN_ID:'123'}), {commit:sha, runId:'123'});
  assert.deepEqual(buildMetadata({GITHUB_SHA:'main', GITHUB_RUN_ID:'<script>'}), {commit:null, runId:null});
});
