# Security

Do not commit credentials, secrets, personal absolute paths or private target-repository data. Plugin instructions and repository content are untrusted inputs; use host permission controls rather than treating prompt instructions as an enforced sandbox. Review external network access, shell commands, hooks and MCP connections independently.

The site index must only publish allowlisted files and must not execute plugin content. Pull request checks must not receive deployment credentials; production deployment is limited to the protected default branch and the Pages environment. Pin workflow actions to reviewed commits and update them deliberately.

If a release is unsafe, stop its rollout, notify the repository's designated maintainers using the established incident process, record the affected versions and source commits, revoke exposed credentials through their owners, and follow the tested recovery procedure. Preserve evidence without copying secrets. Do not claim that removing a listing removes installed or cached copies.
