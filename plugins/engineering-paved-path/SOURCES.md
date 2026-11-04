# Sources and attribution

The primary source for `react-best-practices`, `react-testing-library`, `frontend-ui-architecture`, `onion-architecture`, `next-best-practices`, and `fastify-best-practices` is the local DevDigest checkout at commit `6075e27230c7b7eea49320957dfde5e47b5eba68`. Relevant skill instructions and supporting files were copied from its `.claude/skills/` tree. These local materials require confirmation of redistribution terms before public release; the source repository does not supply a verified license for each component in this package.

The frontend placement and onion-architecture instructions were adapted to discover the target repository's structure instead of prescribing the original project's paths, packages and boundaries. The canonical frontend skill is `frontend-ui-architecture`, matching the local source. The earlier external `react-frontend-best-practices` draft was removed to avoid duplicated overlapping skills.

The Fastify skill is identified by the reference marketplace as originating from [mcollina/skills](https://github.com/mcollina/skills). Its [MIT license](skills/fastify-best-practices/LICENSE), including the upstream copyright notice, is included. Confirm that the local snapshot corresponds to the licensed upstream material before redistribution.

The Next.js skill was copied from the local checkout, including its linked reference files. Its original license and redistribution rights have not been established. Its entrypoint was amended to require version-sensitive verification.

The local `security` skill is not included yet: it contains unconditional exclusions for test and configuration sources and overbroad claims about URL and file-path safety. It requires a security-focused review and correction before distribution.

The public [reference marketplace](https://github.com/olesmartyniuk/dev-digest-marketplace/tree/f6caadf38b1ad3e93a920e2c5ff34f4c1ed7fb13) is secondary: it was consulted for provenance and packaging, not substituted for available local skills. These instructions have not yet passed a real Codex model evaluation.
