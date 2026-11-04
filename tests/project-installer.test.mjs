import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync, chmodSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/ai-marketplace.mjs', import.meta.url));
function project(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ai-marketplace-project-'));
  t.after(() => rmSync(dir, {recursive:true,force:true}));
  execFileSync('git',['init','--quiet',dir]);
  return dir;
}
const install = dir => spawnSync(process.execPath,[cli,'add','architecture-review','--project'],{cwd:dir,encoding:'utf8'});

test('installs into project, preserves settings and is idempotent', t => {
  const dir = project(t);
  mkdirSync(join(dir,'.codex'),{recursive:true});
  writeFileSync(join(dir,'.codex/config.toml'),'# Keep project settings\nmodel = "existing-model"\n');
  chmodSync(join(dir,'.codex/config.toml'),0o600);
  const first = install(dir); assert.equal(first.status,0,first.stderr);
  const market = JSON.parse(readFileSync(join(dir,'.agents/plugins/marketplace.json'),'utf8'));
  assert.ok(market.plugins.some(item => item.name === 'architecture-review'));
  assert.ok(market.plugins.some(item => item.name === 'engineering-paved-path'));
  assert.match(readFileSync(join(dir,'.codex/config.toml'),'utf8'),/\[plugins\."architecture-review@/);
  assert.match(readFileSync(join(dir,'.codex/config.toml'),'utf8'),/\[plugins\."engineering-paved-path@/);
  assert.match(readFileSync(join(dir,'.codex/config.toml'),'utf8'),/# Keep project settings/);
  assert.equal(statSync(join(dir,'.codex/config.toml')).mode & 0o777,0o600);
  assert.equal(JSON.parse(readFileSync(join(dir,'.agents/plugins/vendor/ai-marketplace/architecture-review/plugin.json'),'utf8')).name,'architecture-review');
  const before = readFileSync(join(dir,'.codex/config.toml'),'utf8');
  const second = install(dir); assert.equal(second.status,0,second.stderr);
  assert.equal(readFileSync(join(dir,'.codex/config.toml'),'utf8'),before);
});

test('refuses to overwrite a different existing plugin without modifying config', t => {
  const dir = project(t), target=join(dir,'.agents/plugins/vendor/ai-marketplace/architecture-review');
  mkdirSync(target,{recursive:true}); writeFileSync(join(target,'plugin.json'),'{"name":"different"}');
  const result=install(dir); assert.notEqual(result.status,0);
  assert.equal(readFileSync(join(target,'plugin.json'),'utf8'),'{"name":"different"}');
  assert.equal(existsSync(join(dir,'.codex/config.toml')),false);
});

test('preserves an existing marketplace and its project configuration', t => {
  const dir=project(t); mkdirSync(join(dir,'.agents/plugins'),{recursive:true}); mkdirSync(join(dir,'.codex'),{recursive:true});
  const previous={name:'existing-team',plugins:[{name:'other',source:{source:'local',path:'./other'}}]};
  writeFileSync(join(dir,'.agents/plugins/marketplace.json'),JSON.stringify(previous));
  writeFileSync(join(dir,'.codex/config.toml'),'[plugins."other@existing-team"]\nenabled = true\n');
  const result=install(dir); assert.equal(result.status,0,result.stderr);
  const market=JSON.parse(readFileSync(join(dir,'.agents/plugins/marketplace.json'),'utf8'));
  assert.deepEqual(market.plugins[0],previous.plugins[0]);
  const config=readFileSync(join(dir,'.codex/config.toml'),'utf8');
  assert.match(config,/\[plugins\."other@existing-team"\]/); assert.match(config,/\[plugins\."architecture-review@existing-team"\]/);
});

test('rejects malformed configuration without writing marketplace or plugin', t => {
  const dir=project(t); mkdirSync(join(dir,'.codex')); writeFileSync(join(dir,'.codex/config.toml'),'this is invalid');
  assert.notEqual(install(dir).status,0); assert.equal(existsSync(join(dir,'.agents/plugins/marketplace.json')),false);
  assert.equal(readFileSync(join(dir,'.codex/config.toml'),'utf8'),'this is invalid');
});

test('rejects symlinked project paths including dangling symlinks', t => {
  const dir=project(t); symlinkSync(join(dir,'missing'),join(dir,'.agents'));
  assert.notEqual(install(dir).status,0); assert.equal(existsSync(join(dir,'missing')),false);
});

test('runs from a nested directory of the current repository', t => {
  const dir=project(t); mkdirSync(join(dir,'subdir'));
  const result=spawnSync(process.execPath,[cli,'add','architecture-review','--project'],{cwd:join(dir,'subdir'),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr); assert.ok(existsSync(join(dir,'.agents/plugins/marketplace.json')));
});

test('does not silently change a disabled plugin or overwrite conflicting marketplace entries', t => {
  const dir=project(t); mkdirSync(join(dir,'.codex'),{recursive:true});
  const previous='[plugins."architecture-review@ai-project"]\nenabled = false\n';
  writeFileSync(join(dir,'.codex/config.toml'),previous);
  const result=install(dir); assert.notEqual(result.status,0);
  assert.equal(readFileSync(join(dir,'.codex/config.toml'),'utf8'),previous);
  assert.equal(existsSync(join(dir,'.agents/plugins/marketplace.json')),false);
});

test('requires a Git project and rejects unknown plugin names', t => {
  const dir=project(t);
  const unknown=spawnSync(process.execPath,[cli,'add','does-not-exist','--project'],{cwd:dir,encoding:'utf8'});
  assert.notEqual(unknown.status,0); assert.equal(existsSync(join(dir,'.agents/plugins/marketplace.json')),false);
  const outside=mkdtempSync(join(tmpdir(),'not-a-project-')); t.after(()=>rmSync(outside,{recursive:true,force:true}));
  assert.notEqual(install(outside).status,0);
});

test('one SDD installation configures its full declared dependency graph', t => {
  const dir=project(t);
  const result=spawnSync(process.execPath,[cli,'add','sdd-engineering','--project'],{cwd:dir,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const market=JSON.parse(readFileSync(join(dir,'.agents/plugins/marketplace.json'),'utf8'));
  assert.deepEqual(market.plugins.map(p=>p.name).sort(),['architecture-review','engineering-paved-path','research-tools','sdd-engineering']);
  const config=readFileSync(join(dir,'.codex/config.toml'),'utf8');
  for (const plugin of market.plugins) assert.ok(config.includes(`[plugins."${plugin.name}@ai-project"]`));
});
