# Cost baseline

Status: **not measured**. No workflow quality or savings claim is supported yet.

## Provider preflight — 2026-11-04

Two read-only Codex CLI 0.153.4 requests asked the model to reply `READY`. The configured `gpt-6.1-terra` and an explicit `gpt-5.4` attempt both failed before completing a turn: the provider reported that the model is not supported with this ChatGPT account (`model_not_found`). These were provider preflight failures, not workflow evaluations. No usable workflow trajectory, acceptance result, token baseline or cost comparison was produced.

## Experiment protocol

Choose one approved small-feature request, a fixed target repository and an acceptance set. Record the client, available model, plugin versions and actual loaded skills. Run a baseline and record tokens, pricing basis, duration and each acceptance result. Change exactly one context source, rerun against the same task and acceptance set, and record the same measurements. Save sanitized evidence without credentials or private target data. Report savings only when actual measured cost falls and all agreed quality criteria pass; report inconclusive or failed runs explicitly.
