# Architecture Review

An independent reviewer for project-specific architecture boundaries.

## Install and use

Register this marketplace in Claude Code and install `architecture-review@ai-marketplace`. The plugin declares `engineering-paved-path` as a dependency. Give `architecture-review:architecture-reviewer` a change scope and relevant project rules; it uses `engineering-paved-path:architecture-boundaries` and returns evidence-backed findings and coverage limitations.

The agent is instructed not to edit files. Dependency installation, skill activation and the runtime's read-only boundary have not yet been verified.

For Codex, this package also provides an `architecture-reviewer` skill. The declared Claude dependency is not known to install automatically in Codex; install and verify `engineering-paved-path` separately. The skill's read-only instruction is not an enforced sandbox.
