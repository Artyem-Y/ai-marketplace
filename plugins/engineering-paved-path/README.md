# Engineering Paved Path

Reusable, task-focused engineering guidance for target repositories.

## Install and use

To copy this plugin's skills into a target Git project and configure its project marketplace:

```sh
npx --yes github:Artyem-Y/ai-marketplace add engineering-paved-path --project
```

See the [project installation guide](../../README.md#install-into-a-project) for runtime discovery limits and profile-level installation.

Register this marketplace in Claude Code and install `engineering-paved-path@ai-marketplace`. Invoke `engineering-paved-path:architecture-boundaries` for an evidence-based review of project-specific architectural boundaries. `architecture-review` declares this plugin as a dependency.

## Contents and limitations

The package contains `architecture-boundaries`, `onion-architecture`, `react-best-practices`, `frontend-ui-architecture`, `react-testing-library`, `next-best-practices`, and `fastify-best-practices`. These are sourced from the local harness where available and generalized for other projects. Apply them only where relevant and follow the target repository's instructions and architecture. Installation and cross-plugin skill activation have not yet been verified in Claude Code or in a real Codex model run. See [sources and attribution](SOURCES.md).

The root `plugin.json` also provides portable metadata for Codex plugin hosts. Installation and discovery in Codex remain to be verified.
