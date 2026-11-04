# SDD Engineering

A draft specification-driven development workflow for a target repository.

## Install

To configure this plugin and its dependencies in a target Git project:

```sh
npx --yes github:Artyem-Y/ai-marketplace add sdd-engineering --project
```

The installer copies skill and agent files; it does not establish automatic Codex subagent discovery or skill activation. See the [project installation guide](../../README.md#install-into-a-project).

Register this marketplace in Claude Code and install `sdd-engineering@ai-marketplace`. Its declared dependencies are `engineering-paved-path`, `research-tools` and `architecture-review`. Dependency installation and invocation still require verification with the target Claude Code version.

## Workflow

1. `sdd-engineering:spec-creator` prepares behavior and acceptance criteria.
2. `sdd-engineering:implementation-planner` creates a plan after specification review.
3. Invoke `/sdd-engineering:run-plan` with an approved plan. It coordinates `implementer`, independent architecture review and `plan-verifier` where the host supports them.
4. Invoke `/sdd-engineering:workflow-retro` explicitly when a completed run should be evaluated.

The workflow reads the target repository's instructions and checks. Research is available through `research-tools:researcher`. Missing permissions, agents, inputs and verification are reported as blockers or gaps. Agents and instructions are not a substitute for enforced host permissions. This draft has not completed a clean-install or end-to-end workflow test.

## Codex compatibility

The portable `plugin.json` packages skills for the four SDD roles as well as `run-plan` and `workflow-retro`. The role skills reference their accompanying instruction files; they do not automatically create separate agents or enforce read-only access. The `agents/*.md` files use Claude agent conventions; their automatic discovery in Codex is not established.

Codex CLI 0.153.4 installed `sdd-engineering` in an isolated local profile, but did not automatically install the three Claude manifest dependencies. Install each separately. Cached files were inspected; model activation, delegation and the end-to-end workflow have not been verified. When delegation is unavailable, `run-plan` must disclose that review is not independent.

```sh
codex plugin marketplace add /path/to/marketplace
codex plugin add engineering-paved-path@ai-marketplace
codex plugin add research-tools@ai-marketplace
codex plugin add architecture-review@ai-marketplace
codex plugin add sdd-engineering@ai-marketplace
```
