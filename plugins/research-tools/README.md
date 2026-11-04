# Research Tools

An evidence-oriented researcher for project and external sources.

## Install and use

Register this marketplace in Claude Code and install `research-tools@ai-marketplace`. Ask `research-tools:researcher` a specific question and identify whether the sources are local, external or both. The agent returns locators, findings and gaps; it is instructed not to change files.

The actual tool permission boundary and installation have not yet been tested. Web research requires the host's configured web tools.

For Codex, the portable package also contains a `researcher` skill. Its read-only instruction is not an enforced sandbox; actual permissions depend on the host and execution environment. Automatic discovery of the Claude-format agent is not established.
