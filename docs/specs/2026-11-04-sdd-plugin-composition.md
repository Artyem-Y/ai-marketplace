# SDD Engineering Plugin Composition

**Status:** Draft for review

**Scope:** Portable Claude Code plugin packages and their relationships. This document specifies desired behavior; the plugins and their compatibility are not yet verified in this repository.

## Purpose

Package the reusable parts of the local DevDigest harness so that a team can install and use the SDD workflow in another repository while retaining that repository's own instructions, architecture and test commands. The marketplace is independent from DevDigest. All shipped documentation and descriptions are in English.

The local `.claude/agents` and `.claude/skills` directories are the original inputs. The [DevDigest marketplace](https://github.com/olesmartyniuk/dev-digest-marketplace) is a reference implementation, not proof that this marketplace has the same content or behavior. Record the exact source revision, origin, license and adaptations for every imported component.

## Plugin boundaries

| Plugin | Contents and responsibility | Independent use |
| --- | --- | --- |
| `sdd-engineering` | Four agents: `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`; two skills: `run-plan`, `workflow-retro`. Owns the SDD workflow and handoffs. | Main workflow package |
| `research-tools` | `researcher`, a read-only agent for bounded project or web research with evidence and explicit missing information. | Can be installed without SDD |
| `architecture-review` | `architecture-reviewer`, an independent read-only reviewer that reports evidence, applicable rules and unreviewed scope. | Can be installed without SDD |
| `engineering-paved-path` | Reusable, task-triggered engineering practice skills shared by the other plugins. | Can be installed without SDD |

`sdd-engineering` declares the three other plugins as dependencies. `architecture-review` declares `engineering-paved-path` as a dependency and uses its applicable shared architecture and engineering skills. Avoid circular dependencies. Represent dependencies, source, versions and tags using the supported Claude Code format, then validate and test installation with the chosen CLI version. Do not infer equivalent automatic dependency behavior in Codex.

## SDD workflow

1. `spec-creator` turns the request into a behavior-focused specification and records unresolved questions or assumptions; it does not create an implementation plan. It may request evidence from `researcher`.
2. `implementation-planner` consumes an agreed specification and produces an actionable plan with requirements mapping, checks and execution mode. It does not silently resolve blocking gaps.
3. `run-plan` coordinates execution of an approved plan, including preflight, appropriate task handoffs, bounded correction and completion verification. It must stop and report blockers instead of declaring success without evidence.
4. `implementer` changes only the authorized scope and runs relevant focused checks. Applicable shared skills are selected for the target task.
5. `architecture-reviewer` independently reviews relevant changes, states findings and coverage limitations, and never edits files. The workflow must explicitly define how review findings affect its final verdict; do not assume the reviewer's report alone enforces a gate.
6. `plan-verifier` independently evaluates requirements and verification evidence, reports `MET`, `NOT MET` or `BLOCKED` with evidence, and does not edit implementation files.
7. `workflow-retro` is a separate, explicitly invoked skill after a run. It reports available workflow, timing and cost evidence and limitations; it must not automatically change instructions or rerun work.

Keep `run-plan` and `workflow-retro` as two distinct skills; they serve different purposes. Agent statuses and handoff fields must be specified consistently in the SDD plugin README and checked in evals. Approval, writing and tool permissions must reflect the actual client rather than relying on prompt text alone.

## Shared skills

The following are candidates for `engineering-paved-path`, not a promise to copy the full local DevDigest environment:

- `react-best-practices`, `frontend-ui-architecture`, `next-best-practices` and `react-testing-library` for applicable frontend work.
- `fastify-best-practices` and `onion-architecture` for applicable backend and architecture work.
- `security` for relevant cross-cutting security requirements; an architecture review is not a substitute for a security review.
- Evaluate `api-contract-reviewer` when a task changes a shared HTTP or module contract; include it only after portability, ownership and activation rules are checked.

The reference marketplace calls its frontend structure skill `react-frontend-best-practices`; the local repository uses `frontend-ui-architecture`. Choose and document a canonical name after comparing their contents; do not assume they are identical. The local `sdd-spec-writing` is specific to SDD and belongs with `sdd-engineering` if generalized and retained, rather than being duplicated in each plugin. Local `devdigest-verification`, `devdigest-security-review` and project-specific checks must not be advertised as portable without an explicit generalization and evaluation. Unneeded skills stay out of the initial packages.

Keep one authoritative copy of each shared skill. Document source, trigger, owner and consumers; load skills only for tasks to which they apply. Validate runtime namespacing and cross-plugin skill access using the actual client. A declared dependency is not evidence that a skill was activated.

## Package structure and documentation

```text
.claude-plugin/marketplace.json
plugins/
  sdd-engineering/
    .claude-plugin/plugin.json
    agents/{spec-creator,implementation-planner,implementer,plan-verifier}.md
    skills/{run-plan,workflow-retro}/SKILL.md
    README.md
    CHANGELOG.md
    evals/
  research-tools/{.claude-plugin/plugin.json,agents/researcher.md,README.md,CHANGELOG.md,evals/}
  architecture-review/{.claude-plugin/plugin.json,agents/architecture-reviewer.md,README.md,CHANGELOG.md,evals/}
  engineering-paved-path/{.claude-plugin/plugin.json,skills/,README.md,CHANGELOG.md,evals/}
```

The tree describes intended logical files, not existing files. Ship each skill's necessary references and scripts inside its package, using supported plugin-relative paths. Add a separate plugin-specific skill directory only when it is part of the validated workflow. All agents, skills, supporting files and scripts must be audited and generalized: remove hard-coded DevDigest repository names, package layouts, paths and verification commands, and discover project-specific information from the target repository. Preserve generic tool conventions and portable illustrative examples. Do not bundle credentials, user-specific absolute paths or target-project instructions.

The SDD `README.md` explains the full workflow, agent contracts, dependencies, installation, invocation, approval and failure behavior, target-repository instructions, permissions, limitations and examples. Every plugin has a manifest, an English README describing its capabilities, components, installation, use, dependencies, permissions and limitations, and a changelog. Reference README files may be adapted after verifying their source, accuracy, attribution and redistribution terms. Changelogs record released versions and breaking changes; do not mark a version released before its tag and installation have been verified. Repository release documentation describes tag conventions, compatibility, marketplace refresh, plugin update, active-session reload and tested recovery.

## Acceptance criteria

1. All four plugins appear in the Claude marketplace with valid unique names and manifests. `architecture-review` explicitly depends on `engineering-paved-path`; all declared dependencies resolve without cycles. Unsupported cross-client behavior is documented rather than assumed.
2. Each required agent and skill is present once in the intended package, with its supporting files; README examples match actual names and supported invocation.
3. A clean installation of `sdd-engineering` in a separate existing repository loads the declared dependencies. The target's instructions and test commands remain authoritative; no DevDigest-only paths, credentials or hidden local files are required.
4. A fixed small-feature scenario demonstrates the spec → plan → implementation → independent review → verification handoffs, including a blocked case and an evidence-backed verdict. Verify actual dispatch and skill activation rather than only checking manifests.
5. `researcher`, `architecture-reviewer` and `plan-verifier` do not write files in their tested execution environment; report any unverified boundary. `workflow-retro` runs only on request and does not modify the workflow.
6. An eval set covers a relevant positive and negative case for each shared skill and the core workflow. Record client/model versions and separate deterministic fixture evidence from real-provider runs.
7. For the lab, record clean install of `sdd-engineering@1.0.0`, upgrade to `1.1.0`, and a rehearsed return to the actual `1.0.0` content, including cache, dependencies and session reload. Distinguish an exact pin from a newer release containing a revert.
8. README, changelog and release metadata accurately reflect verified behavior; each imported component has traceable provenance and no secrets or machine-specific paths.

## Open decisions

- Confirm the exact portable skill set and canonical frontend skill name after source comparison.
- Confirm target Claude Code version, dependency syntax and resolution; validate Codex separately before claiming support.
- Choose release tag naming and supported recovery mechanism after testing them with the actual client.
- Identify the separate target repository and fixed scenario; define eval thresholds before measuring quality or cost.
