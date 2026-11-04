# Contributing

Plugins live under `plugins/<name>/`. Each package has a portable `plugin.json`, Claude manifest, README, changelog and the skills or agents it actually provides. Marketplace entries must match the plugin name and source. Declare Claude dependencies in the plugin manifest; do not assume Codex installs them automatically.

For pull requests, changes to plugin contents must increase the stable `MAJOR.MINOR.PATCH` version in both manifests and update the plugin's changelog. Changes limited to a plugin's root `README.md`, `CHANGELOG.md`, or `SOURCES.md` do not require a version bump. The CI check compares against the PR base; it does not enforce branch protection or establish a published release.

Keep instructions reusable across target repositories. Document source and attribution for imported content, avoid project-specific absolute paths and secrets, and ship all referenced resources. Add behavioral tests for the workflow being changed, including failure and permission boundaries. Keep UI text and documentation in English.

Review the complete package and its provenance before approval: inspect bundled instructions and supporting files, identify commands and external access, confirm distribution rights, and check that no secrets, private memory, or production data are included. CI is not a substitute for package review.

The public catalog indexes each declared skill's `SKILL.md`, Markdown files directly inside its skill directory, and Markdown files directly inside its `rules`, `references`, and `examples` directories. Hidden files, other file types, and deeper directories are excluded. Symlinks on indexed paths are rejected. Review every allowed document as public content before merging; exclusions do not make files in a public repository private. The indexer reads text and does not execute plugin content.

Catalog search uses case-insensitive substring matching for all non-stopword query terms. It ranks name and description matches above instruction text; it does not translate queries or provide semantic search. Multiple matching files are grouped under their skill.

Keep English interface text, including accessibility labels, in `site/src/messages.js`. Artifact descriptions and instruction content come from marketplace data and are not interface translations.

Before opening a pull request, run `node --test tests/*.test.mjs` with Node 22 and Codex CLI installed, then run `npm ci` and `npm run build` in `site/`. Describe changes, dependencies, verification and unverified boundaries. The Pages workflow reports harness and catalog checks and the site build as separate jobs; deployment requires both to pass. The local Codex installation test requires Codex CLI and is not run by that workflow.
