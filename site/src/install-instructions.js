// Reviewed commands only. Never derive shell commands from index content.
const register = 'codex plugin marketplace add Artyem-Y/ai-marketplace --ref main';
const engineering = 'codex plugin add engineering-paved-path@ai-marketplace';
const research = 'codex plugin add research-tools@ai-marketplace';
const architecture = 'codex plugin add architecture-review@ai-marketplace';
const sdd = 'codex plugin add sdd-engineering@ai-marketplace';
const commands = {
  'engineering-paved-path': [register, engineering],
  'research-tools': [register, research],
  'architecture-review': [register, engineering, architecture],
  'sdd-engineering': [register, engineering, research, architecture, sdd],
};
const projectCommands = {
  'engineering-paved-path': ['npx --yes github:Artyem-Y/ai-marketplace add engineering-paved-path --project'],
  'research-tools': ['npx --yes github:Artyem-Y/ai-marketplace add research-tools --project'],
  'architecture-review': ['npx --yes github:Artyem-Y/ai-marketplace add architecture-review --project'],
  'sdd-engineering': ['npx --yes github:Artyem-Y/ai-marketplace add sdd-engineering --project'],
};

export function instructionsFor(item) {
  const parent = item.type === 'plugin' ? item.name : item.plugin;
  if (!Object.prototype.hasOwnProperty.call(commands, parent)) return null;
  if (item.type === 'plugin' && item.id !== `plugin:${parent}`) return null;
  if (['skill','agent'].includes(item.type)) {
    if (typeof item.id !== 'string' || !item.id.startsWith(`${item.type}:${parent}/`)) return null;
  } else if (item.type !== 'plugin') return null;
  return { plugin:parent, commands:commands[parent], projectCommands:projectCommands[parent] };
}
