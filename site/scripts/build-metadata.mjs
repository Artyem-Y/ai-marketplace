export function buildMetadata(env) {
  return {
    commit: /^[a-f0-9]{40}$/i.test(env.GITHUB_SHA ?? '') ? env.GITHUB_SHA.toLowerCase() : null,
    runId: /^[0-9]+$/.test(env.GITHUB_RUN_ID ?? '') ? env.GITHUB_RUN_ID : null,
  };
}
