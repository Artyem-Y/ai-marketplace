# Portable instruction import

The six agent prompts and SDD workflow instructions were adapted from the local DevDigest checkout at commit `6075e27230c7b7eea49320957dfde5e47b5eba68`. The current source checkout may contain uncommitted changes, so the commit alone is not a complete snapshot identifier.

The agent prompts retain the source workflow, output formats, evidence requirements, and boundaries, while replacing project-specific paths, assumptions, and unavailable mandatory skills with target-repository discovery. Each plugin includes the shared handoff protocol. `run-plan` and `workflow-retro` retain their detailed procedures; the latter includes the source's Claude-format journal analyzer. That analyzer is not a Codex transcript parser. `sdd-spec-writing` is included as a portable skill.

Existing engineering skills and supporting files were compared with the local source. See `plugins/engineering-paved-path/SOURCES.md` for individual attribution, adaptations, and unresolved redistribution terms. Source-specific inventory files and evaluation fixtures are not runtime dependencies. These imports have not demonstrated behavioral equivalence with the original instructions. Check ownership and redistribution rights before a public release.

A clean project install confirmed byte-identical copies of representative agents, skills, and the journal analyzer. In a trusted, isolated Codex CLI 0.153.4 profile, the plugin listing was empty and startup reported the configured project plugins were not installed in the Codex cache. An authenticated model evaluation and native subagent discovery are therefore still required; no automatic skill activation or independent agent delegation is established by copying files.
