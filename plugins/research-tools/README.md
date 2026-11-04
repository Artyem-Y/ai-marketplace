# Research Tools

An evidence-oriented researcher for project and external sources.

## Install and use

To copy this plugin's skill and agent files into a target Git project and configure its project marketplace:

```sh
npx --yes github:Artyem-Y/ai-marketplace add research-tools --project
```

This configures project files; automatic Codex subagent discovery and skill activation are not established. See the [project installation guide](../../README.md#install-into-a-project).

Register this marketplace in Claude Code and install `research-tools@ai-marketplace`. Ask `research-tools:researcher` a specific question and identify whether the sources are local, external or both. The agent returns locators, findings and gaps; it is instructed not to change files.

The actual tool permission boundary and installation have not yet been tested. Web research requires the host's configured web tools.

For Codex, the portable package also contains a `researcher` skill. Its read-only instruction is not an enforced sandbox; actual permissions depend on the host and execution environment. Automatic discovery of the Claude-format agent is not established.
