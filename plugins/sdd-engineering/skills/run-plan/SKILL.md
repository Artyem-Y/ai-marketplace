---
name: run-plan
description: Coordinate an approved implementation plan with independent review and verification.
---

## Preconditions

Use only after the specification and plan are approved. Read the plan, its specification and target-repository instructions. Identify the intended change, requirements, scope, verification commands, existing worktree changes and authorized execution mode. If required information or permissions are absent, report `BLOCKED`; do not invent requirements or overwrite unrelated changes. Ask for clarification when the conflict prevents further work, while continuing independent authorized steps where possible.

## Execution

1. Before implementation, check that plan steps are traceable to requirements and that verification can establish each result. Record any unverified preconditions.
2. Implement in dependency order. Use relevant engineering guidance only when it applies. Delegate bounded tasks only if the user and host permit delegation. Provide each worker the exact scope, constraints, target instructions and expected handoff.
3. Run focused checks for each change. Record commands and actual outcomes. Stop at a failed prerequisite; do not weaken or silently skip a check. A worker reports `COMPLETE`, `PARTIAL` or `BLOCKED`, changed files, checks and unresolved issues.
4. After implementation, request independent architecture review and conditional security review when the host supports and permits them. Supply the changed files, intended behavior and revision or diff. Reviewers report findings, evidence and uncovered scope; a read-only instruction alone is not an enforced permission boundary.
5. Independently verify each requirement against actual evidence. Record `MET`, `NOT MET` or `BLOCKED`, plus command output or a precise source locator. Unexecuted checks and missing traces cannot establish a pass.
6. Resolve review findings within the approved scope and rerun affected checks. Stop and return unresolved issues if fixing them requires new authorization, the same issue repeats, or verification cannot be completed. Do not hide unresolved critical findings behind a success label.

If separate agents are unavailable or forbidden, do the authorized work that remains possible and explicitly label review and verification as not independent. Do not claim a separate reviewer ran. Never publish, merge, push or change external configuration implicitly.

## Handoff

Return `COMPLETE`, `PARTIAL` or `BLOCKED`, the specification and plan paths, changed files, verification commands and outcomes, review findings, unresolved risks and any unverified requirements. `COMPLETE` requires every required acceptance criterion and gate to have evidence. The separate `workflow-retro` skill runs only when explicitly requested.
