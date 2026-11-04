import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildIndex } from '../../scripts/build-index.mjs';
import { buildMetadata } from './build-metadata.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const outputDir = fileURLToPath(new URL('../public/', import.meta.url));
const index = await buildIndex(root);
index.build = buildMetadata(process.env);
await mkdir(outputDir, { recursive: true });
await writeFile(new URL('../public/search-index.json', import.meta.url), JSON.stringify(index, null, 2) + '\n');
console.log(`Indexed ${index.items.length} artifacts from ${index.marketplace}.`);
