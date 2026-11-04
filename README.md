# AI Marketplace

A repository of reusable AI engineering plugins and a searchable catalog. The plugins are designed to be used across projects while keeping project-specific instructions and configuration in the target repository.

Browse the [GitHub Pages catalog](https://artyem-y.github.io/ai-marketplace/) to search the available plugins, skills, and agents.

## Plugins

| Plugin | Purpose |
| --- | --- |
| [engineering-paved-path](plugins/engineering-paved-path/README.md) | Reusable engineering practices and architecture guidance. |
| [research-tools](plugins/research-tools/README.md) | Evidence-led research and source comparison. |
| [architecture-review](plugins/architecture-review/README.md) | Independent architecture review guidance. |
| [sdd-engineering](plugins/sdd-engineering/README.md) | A specification-driven workflow for specs, plans, implementation, verification, and retrospectives. |

These plugins are drafts. Codex skill activation, agent discovery, independent delegation, and the complete SDD workflow have not yet been verified end to end. Prompt instructions alone do not enforce read-only permissions.

## Install into a project

From the target Git repository, use the project installer to copy a plugin into that repository and configure its project marketplace and Codex settings:

```sh
npx --yes github:Artyem-Y/ai-marketplace add architecture-review --project
```

The command uses the current GitHub default-branch snapshot and copies the selected plugin and its declared dependencies into `.agents/plugins/vendor/ai-marketplace/`. It adds entries to `.agents/plugins/marketplace.json` and enables them in `.codex/config.toml`, preserving existing entries and settings. Re-running with identical content is safe; a conflicting plugin directory or configuration must be resolved manually. To use a reviewed fixed snapshot, replace the GitHub source with `github:Artyem-Y/ai-marketplace#<commit-sha>`.

The project installer follows the dependencies declared in the plugin manifests. Commit the project files if they should be shared with the team. Profile-level installation using the Codex CLI requires dependencies to be installed separately.

The installer copies skill and agent files, but it does not register agents as Codex-native subagents or prove skill activation. Codex may use a user cache, and the project must be trusted for its Codex configuration to apply. In an isolated trusted project with Codex CLI 0.153.4, `codex plugin list --available --json` did not report the project marketplace; runtime discovery remains unverified. Review downloaded plugin content before use.

## Install for your Codex profile

Add this marketplace once, then install the plugins you need:

```sh
codex plugin marketplace add Artyem-Y/ai-marketplace --ref main
codex plugin add engineering-paved-path@ai-marketplace
codex plugin add research-tools@ai-marketplace
codex plugin add architecture-review@ai-marketplace
codex plugin add sdd-engineering@ai-marketplace
```

The example installs the SDD plugin and its declared dependencies. In a local test with Codex CLI 0.153.4, dependencies were not installed automatically, so install each one separately. See the individual plugin READMEs for usage and current verification limits.

## Updates

The catalog website is rebuilt and deployed after changes reach `main`. Updating the website does not update an installed marketplace or plugin.

To refresh a Git marketplace registered for your Codex profile manually:

```sh
codex plugin marketplace list
codex plugin marketplace upgrade ai-marketplace
```

Use `codex plugin marketplace upgrade` without a name to refresh all configured Git marketplaces. Tracking the `main` branch allows the marketplace to follow new commits; a fixed tag or commit does not. An isolated test confirmed that a manual marketplace refresh updated `research-tools` from 0.1.0 to 0.1.1 in Codex CLI 0.153.4. Loading changes in an active session has not been verified. Verify the installed content and start a new session when testing an update. No automatic update setting has been verified for this Codex setup.

Project-installed files are copies and are not updated by the profile-level marketplace refresh. The installer refuses to replace different existing content; upgrading or removing a project copy requires a separate reviewed procedure.

When changing a plugin, update its portable and Claude manifest versions consistently and record the change in its changelog. Update the marketplace manifest when its entries change. See [Releases and recovery](docs/RELEASES.md) for release and rollback guidance.

## Local development

The catalog is a React and Vite application. With Node.js 20.19 or newer:

```sh
cd site
npm ci
npm run dev
```

The server prints a local URL. The search index is generated at server startup and before each production build; restart the server or run `npm run index` after changing plugin content. See the [site README](site/README.md) and [contribution guide](CONTRIBUTING.md) for development and validation details.

The catalog is generated from repository data and searches locally in the browser. The current index covers declared local plugins, skills, agents, and allowed skill documentation; hooks and MCP servers are not yet indexed.
