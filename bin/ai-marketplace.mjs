#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import toml from '@iarna/toml';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const usage = 'Usage: ai-marketplace add <plugin-name> --project';

function safePath(root, rel) {
  let current = root;
  for (const part of rel.split('/')) {
    if (!part || part === '.' || part === '..') throw new Error('Invalid project path');
    current = join(current, part);
    try { if (lstatSync(current).isSymbolicLink()) throw new Error(`Symbolic links are not supported: ${rel}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return current;
}

function digestTree(dir) {
  const entries = [];
  function walk(base, prefix = '') {
    for (const entry of readdirSync(base, {withFileTypes:true}).sort((a,b) => a.name.localeCompare(b.name,'en'))) {
      const file = join(base,entry.name), name = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not supported in plugins: ${name}`);
      if (entry.isDirectory()) { entries.push(`dir:${name}`); walk(file,name); }
      else if (entry.isFile()) entries.push(`file:${name}:${createHash('sha256').update(readFileSync(file)).digest('hex')}`);
      else throw new Error(`Unsupported plugin file: ${name}`);
    }
  }
  walk(dir);
  return entries.join('\n');
}

function install(name, cwd) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error('Invalid plugin name');
  let root;
  try { root = execFileSync('git',['rev-parse','--show-toplevel'],{cwd,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); }
  catch { throw new Error('Run this command inside a Git repository'); }
  const sourceMarket = JSON.parse(readFileSync(join(sourceRoot,'.agents/plugins/marketplace.json'),'utf8'));
  const packages = [], visited = new Set(), visiting = new Set();
  function collect(pluginName) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pluginName)) throw new Error('Invalid dependency name');
    if (visiting.has(pluginName)) throw new Error(`Plugin dependency cycle: ${pluginName}`);
    if (visited.has(pluginName)) return;
    const entry = sourceMarket.plugins.find(item => item.name === pluginName);
    if (!entry || entry.source?.source !== 'local' || entry.source.path !== `./plugins/${pluginName}`) throw new Error(`Unknown or unsupported plugin: ${pluginName}`);
    const source = safePath(sourceRoot, `plugins/${pluginName}`);
    const sourceDigest = digestTree(source);
    const manifest = JSON.parse(readFileSync(join(source,'plugin.json'),'utf8'));
    if (manifest.name !== pluginName) throw new Error(`Plugin manifest name mismatch: ${pluginName}`);
    const claude = join(source,'.claude-plugin/plugin.json');
    const dependencies = existsSync(claude) ? (JSON.parse(readFileSync(claude,'utf8')).dependencies ?? []) : [];
    if (!Array.isArray(dependencies)) throw new Error(`Invalid dependencies: ${pluginName}`);
    visiting.add(pluginName);
    for (const dep of dependencies) {
      if (typeof dep !== 'string') throw new Error(`Unsupported dependency declaration in ${pluginName}; resolve it manually`);
      collect(dep);
    }
    visiting.delete(pluginName); visited.add(pluginName);
    const targetRel = `.agents/plugins/vendor/ai-marketplace/${pluginName}`;
    const target = safePath(root,targetRel), targetExists = existsSync(target);
    if (targetExists && (!lstatSync(target).isDirectory() || digestTree(target) !== sourceDigest)) throw new Error(`Plugin directory already exists with different content: ${targetRel}`);
    packages.push({name:pluginName,entry,source,sourceDigest,manifest,targetRel,target,targetExists});
  }
  collect(name);

  const marketRel = '.agents/plugins/marketplace.json', configRel = '.codex/config.toml';
  const marketFile = safePath(root,marketRel), configFile = safePath(root,configRel);

  const marketBefore = existsSync(marketFile) ? readFileSync(marketFile,'utf8') : null;
  const marketMode = marketBefore === null ? 0o644 : lstatSync(marketFile).mode & 0o777;
  const market = marketBefore === null ? {name:'ai-project',interface:{displayName:'Project plugins'},plugins:[]} : JSON.parse(marketBefore);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(market.name ?? '') || !Array.isArray(market.plugins)) throw new Error('Invalid existing project marketplace');
  let marketChanged = false;
  for (const plugin of packages) {
    const existing = market.plugins.filter(item => item.name === plugin.name);
    if (existing.length > 1) throw new Error('Project marketplace contains duplicate plugin entries');
    const projectSource = `./${plugin.targetRel}`;
    if (existing.length && (existing[0].source?.source !== 'local' || existing[0].source?.path !== projectSource)) throw new Error(`Plugin already exists with a different source: ${plugin.name}`);
    if (!existing.length) { market.plugins.push({...plugin.entry,source:{source:'local',path:projectSource}}); marketChanged=true; }
  }
  const marketAfter = marketChanged ? JSON.stringify(market,null,2)+'\n' : marketBefore;

  const configBefore = existsSync(configFile) ? readFileSync(configFile,'utf8') : null;
  const configMode = configBefore === null ? 0o600 : lstatSync(configFile).mode & 0o777;
  const configText = configBefore ?? '';
  const config = toml.parse(configText);
  let configAfter = configText;
  for (const plugin of packages) {
    const key = `${plugin.name}@${market.name}`, configured = config.plugins?.[key];
    if (configured !== undefined && configured?.enabled !== true) throw new Error(`Plugin is already configured differently: ${key}; update it manually`);
    if (!configured) configAfter += `${configAfter && !configAfter.endsWith('\n') ? '\n' : ''}\n[plugins.${JSON.stringify(key)}]\nenabled = true\n`;
  }
  const validated = toml.parse(configAfter);
  if (packages.some(plugin => validated.plugins?.[`${plugin.name}@${market.name}`]?.enabled !== true)) throw new Error('Could not safely enable the plugins in project configuration');

  // Stage all data first. Never replace a pre-existing plugin directory.
  const stage = mkdtempSync(join(root,'.ai-marketplace-stage-'));
  const installed = []; let marketWritten = false, configWritten = false;
  try {
    for (const plugin of packages) if (!plugin.targetExists) cpSync(plugin.source,join(stage,plugin.name),{recursive:true,errorOnExist:true,force:false});
    if (marketAfter !== marketBefore) { writeFileSync(join(stage,'marketplace.json'),marketAfter,{flag:'wx',mode:marketMode}); if (marketBefore !== null) chmodSync(join(stage,'marketplace.json'),marketMode); }
    if (configAfter !== configBefore) { writeFileSync(join(stage,'config.toml'),configAfter,{flag:'wx',mode:configMode}); if (configBefore !== null) chmodSync(join(stage,'config.toml'),configMode); }
    for (const rel of ['.agents','.agents/plugins','.agents/plugins/vendor','.agents/plugins/vendor/ai-marketplace','.codex']) {
      const dir = safePath(root,rel); mkdirSync(dir,{recursive:true}); safePath(root,rel);
    }
    for (const plugin of packages) if (!plugin.targetExists) { safePath(root,plugin.targetRel); if (existsSync(plugin.target)) throw new Error('Plugin directory appeared during installation'); renameSync(join(stage,plugin.name),plugin.target); installed.push(plugin); }
    const unchanged = (file, previous) => previous === null ? !existsSync(file) : existsSync(file) && readFileSync(file,'utf8') === previous;
    if (marketAfter !== marketBefore) { if (!unchanged(marketFile,marketBefore)) throw new Error('Project marketplace changed during installation'); renameSync(join(stage,'marketplace.json'),marketFile); marketWritten=true; }
    if (configAfter !== configBefore) { if (!unchanged(configFile,configBefore)) throw new Error('Project config changed during installation'); renameSync(join(stage,'config.toml'),configFile); configWritten=true; }
  } catch (error) {
    if (configWritten && readFileSync(configFile,'utf8') === configAfter) { if (configBefore === null) rmSync(configFile); else writeFileSync(configFile,configBefore); }
    if (marketWritten && readFileSync(marketFile,'utf8') === marketAfter) { if (marketBefore === null) rmSync(marketFile); else writeFileSync(marketFile,marketBefore); }
    for (const plugin of installed.reverse()) if (existsSync(plugin.target) && digestTree(plugin.target) === plugin.sourceDigest) rmSync(plugin.target,{recursive:true});
    throw error;
  } finally { rmSync(stage,{recursive:true,force:true}); }

  console.log(`Configured project plugins in ${root}: ${packages.map(plugin => `${plugin.name}@${plugin.manifest.version}`).join(', ')}`);
  console.log('Source: bundled marketplace snapshot. Project files are not updated by profile-level marketplace refresh.');
  console.log('Trust the project in Codex and start a new session. Agent discovery and skill activation must be verified in your client.');
}

try {
  const args = process.argv.slice(2);
  if (args.length !== 3 || args[0] !== 'add' || args[2] !== '--project') throw new Error(usage);
  install(args[1],process.cwd());
} catch (error) { console.error(`Error: ${error.message}`); process.exitCode = 1; }
