# Marketplace catalog site

This directory contains the site project, separate from marketplace manifests and plugins. `design-reference/` is the complete supplied design export. It is a reference, not deployable production source: it contains demonstration data, example commands for another repository, and a runtime that loads external scripts and dynamically evaluates code.

The eventual GitHub Pages build must publish only its generated output, not `design-reference/`. It must use relative asset and index URLs so that a project site works under the configured repository base path. The catalog must be generated from reviewed marketplace data; the reference's hard-coded examples must not be presented as installed or verified plugins.

## Local development

Use Node.js 20.19 or newer. From this directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The development server binds to `127.0.0.1` and reloads changes automatically. Run `npm run build` to produce `dist/`, or `npm run preview` after a build to inspect it locally. Vite uses relative asset paths for GitHub Pages project sites.

The index is regenerated when the development server starts and before each build. Restart the server after changing marketplace files to refresh it. The generator reads the Claude marketplace when present, otherwise the Codex marketplace; it currently supports local plugin paths under `plugins/<name>` and indexes plugin manifests, skills, and agents. Unsupported sources fail the build rather than inventing or silently omitting entries. It does not yet merge both marketplaces or index hooks, MCP, and supporting documents. The complete design and GitHub Pages workflow remain to be implemented and verified.
