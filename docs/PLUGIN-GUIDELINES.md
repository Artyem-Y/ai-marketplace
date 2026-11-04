# Plugin guidelines

Package reusable instructions with their supporting files. Keep the target repository's architecture, instructions and test commands authoritative. Do not ship credentials, machine-specific absolute paths or project-specific assumptions as universal rules.

Each plugin needs an owner, manifest, README, changelog, applicable test cases and documented access requirements. Declare Claude dependencies explicitly; verify behavior separately in other hosts. A skill describing a read-only role does not enforce sandbox permissions or prove independent delegation.

## Current provenance

The SDD and agent instructions are original, abbreviated adaptations informed by the local DevDigest checkout at commit `6075e27230c7b7eea49320957dfde5e47b5eba68`. Engineering skills were copied primarily from that local checkout and generalized; see `plugins/engineering-paved-path/SOURCES.md` for exact sources, adaptations and unresolved redistribution terms. The public reference marketplace at commit `f6caadf38b1ad3e93a920e2c5ff34f4c1ed7fb13` is secondary. This is not a complete transfer. Review each future imported skill's upstream license, supporting resources and project assumptions before copying it.

## Validation

Check manifest consistency and dependency cycles, run the isolated Codex installation test, and evaluate actual skill activation and relevant positive and negative behavior. Record client and model versions, access constraints, evidence and failures. Separate deterministic test results from real-provider evidence.
