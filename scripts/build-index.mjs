import { lstat, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function safePath(root, relative) {
  const parts = relative.split('/');
  if (!relative || parts.some(part => !part || part === '.' || part === '..')) throw new Error(`Invalid source path: ${relative}`);
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error(`Symlink is not permitted: ${relative}`);
  }
  return current;
}

async function readSafe(root, relative) {
  const file = await safePath(root, relative);
  const info = await lstat(file);
  if (!info.isFile() || info.size > 1024 * 1024) throw new Error(`Invalid or oversized file: ${relative}`);
  return readFile(file, 'utf8');
}

// Only Markdown immediately within the skill or these explicitly allowed folders is public.
async function supportingDocuments(root, skillDir) {
  const documents = [];
  for (const subdirectory of ['', 'rules', 'references', 'examples']) {
    const directory = subdirectory ? `${skillDir}/${subdirectory}` : skillDir;
    let entries;
    try { entries = await readdir(await safePath(root, directory), { withFileTypes:true }); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      if (entry.name.startsWith('.') || !entry.name.endsWith('.md') || (!subdirectory && entry.name === 'SKILL.md')) continue;
      const file = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Symlink is not permitted: ${file}`);
      if (entry.isFile()) documents.push({ path:file, body:await readSafe(root, file) });
    }
  }
  return documents;
}

function frontmatter(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter: ${file}`);
  const field = name => {
    const row = match[1].match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
    return row?.[1].trim().replace(/^(['"])(.*)\1$/, '$2');
  };
  const name = field('name'), description = field('description');
  if (!name || !description) throw new Error(`Missing name or description: ${file}`);
  return { name, description, body: match[2] };
}

export async function buildIndex(root) {
  root = path.resolve(root);
  let manifest;
  try { manifest = JSON.parse(await readSafe(root, '.claude-plugin/marketplace.json')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    manifest = JSON.parse(await readSafe(root, '.agents/plugins/marketplace.json'));
  }
  if (typeof manifest.name !== 'string' || !Array.isArray(manifest.plugins)) throw new Error('Invalid marketplace manifest');
  const items = [], ids = new Set();
  const add = item => { if (ids.has(item.id)) throw new Error(`Duplicate artifact: ${item.id}`); ids.add(item.id); items.push(item); };
  for (const entry of manifest.plugins) {
    const source = typeof entry.source === 'string' ? entry.source : entry.source?.source === 'local' ? entry.source.path : null;
    if (typeof entry.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name) || source !== `./plugins/${entry.name}`) throw new Error('Invalid plugin source or name');
    const dir = `plugins/${entry.name}`;
    let manifestPath = `${dir}/.claude-plugin/plugin.json`;
    let metadata;
    try { metadata = JSON.parse(await readSafe(root, manifestPath)); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      manifestPath = `${dir}/.codex-plugin/plugin.json`;
      try { metadata = JSON.parse(await readSafe(root, manifestPath)); }
      catch (fallbackError) {
        if (fallbackError.code !== 'ENOENT') throw fallbackError;
        manifestPath = `${dir}/plugin.json`;
        metadata = JSON.parse(await readSafe(root, manifestPath));
      }
    }
    if (metadata.name !== entry.name || typeof metadata.description !== 'string' || !metadata.description.trim()) throw new Error(`Invalid plugin manifest: ${entry.name}`);
    const plugin = { id:`plugin:${entry.name}`, type:'plugin', name:entry.name, description:metadata.description, version:metadata.version ?? null, path:manifestPath, body:'', children:[], dependencies: (metadata.dependencies ?? []).map(dep => typeof dep === 'string' ? dep : dep.name).filter(Boolean) };
    add(plugin);
    for (const [folder, type] of [['skills','skill'],['agents','agent']]) {
      let children;
      try { children = await readdir(await safePath(root, `${dir}/${folder}`), { withFileTypes:true }); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      for (const child of children.sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
        if (child.isSymbolicLink()) throw new Error(`Symlink is not permitted: ${child.name}`);
        const file = type === 'skill' && child.isDirectory() ? `${dir}/${folder}/${child.name}/SKILL.md` : type === 'agent' && child.isFile() && child.name.endsWith('.md') ? `${dir}/${folder}/${child.name}` : null;
        if (!file) continue;
        const parsed = frontmatter(await readSafe(root, file), file);
        const childId = `${type}:${entry.name}/${parsed.name}`;
        const documents = type === 'skill' ? await supportingDocuments(root, `${dir}/${folder}/${child.name}`) : [];
        add({ id:childId, type, plugin:entry.name, ...parsed, path:file, documents });
        plugin.children.push(childId);
      }
    }
  }
  return { marketplace:manifest.name, items };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? '.');
  const output = process.argv[3];
  if (!output) { console.error('Usage: node scripts/build-index.mjs <repository-root> <output-file>'); process.exitCode = 2; }
  else {
    try { await writeFile(output, JSON.stringify(await buildIndex(root), null, 2) + '\n', { flag:'wx' }); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
