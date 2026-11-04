# Releases and recovery

Plugin releases, marketplace refresh, installed plugin updates, session reload and site deployment are separate operations. No release has been published or verified yet.

## Plugin release

1. Review the plugin and its dependency changes; bump the plugin version consistently in its Claude and portable manifests and update its changelog.
2. Run the repository's automated tests, a clean install, and the relevant behavior evaluations. Record the client version, source commit and verification results.
3. After review and merge, create the plugin-specific tag `<plugin-name>--v<version>` at the reviewed commit. Version-constrained Claude dependencies require appropriate dependency tags. Publishing tags or releases requires the repository's normal authorization and protection rules.
4. Refresh the marketplace and update the installed plugin in each supported client. Restart or reload when required. Verify actual loaded content, not only the marketplace metadata.

In the locally tested Codex CLI 0.153.4, installing `sdd-engineering` did not install the other three plugins automatically. Install and update those packages separately until dependency support is verified.

## Plugin recovery

An exact return to an earlier version and a new release that reverts code are different outcomes. Test the actual client's marketplace source, version selector, cache and session behavior before relying on either. Verify the loaded plugin content and dependency versions in a fresh session. Do not move existing tags or force-push. If an exact `1.0.0` installation cannot be recovered, report the failure rather than calling a newer reverted release `1.0.0`.

## Site recovery

The Pages workflow builds a single artifact containing the site and generated index. A failed build does not deploy a replacement. Recovery must redeploy a previously reviewed site and matching index or rebuild the corresponding reviewed commit through an authorized workflow; document the actual mechanism and retention before production. Verify the deployed build identity, search and direct links. No site rollback procedure has yet been rehearsed.
