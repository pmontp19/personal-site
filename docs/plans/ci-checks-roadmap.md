# CI checks roadmap

Status of GitHub Actions PR validation for this project and the planned next
steps. The site is a static Astro 7 build using **pnpm** and **Node ≥ 22.12**.

## Implemented — Tier 1 (essentials)

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), runs on
PRs to `main` and on pushes to `main`.

| Check | Command | Catches |
| --- | --- | --- |
| Reproducible install | `pnpm install --frozen-lockfile` | `pnpm-lock.yaml` out of sync with `package.json` |
| Build | `pnpm build` | `.astro`/content compile errors, broken endpoints (RSS, sitemap, `llms.txt`), OG image generation failures |

If the build passes, the site is deployable.

## Planned — Tier 2 (code quality)

### Type checking — `astro check`

`astro check` is **not yet enabled** because the project currently has 6
pre-existing type errors that predate the Astro 7 migration (they live in app
code this work did not touch):

- `scripts/generate-git-history.ts` — `htmldiff-js` ships no type declarations
  (`ts7016`). Fix: add a `declare module 'htmldiff-js'` ambient declaration.
- `src/layouts/Layout.astro` — side-effect imports of `@fontsource/geist-sans`
  and `@fontsource/geist-mono` have no type declarations (`ts2882`). Fix: ambient
  module declarations for the font packages.
- `src/components/BlogPosts.astro`, `src/pages/llms.txt.ts` — `string | undefined`
  passed where `string` is required (`ts2345`). Fix: guard/narrow the value.
- `src/pages/index.astro` — content-collection entries not assignable to the
  local `Experience[]` type (`ts2322`). Fix: align the local type with the
  collection schema.

Plan: add `@astrojs/check` + `typescript` as dev dependencies and a
`"check": "astro check"` script, fix the 6 errors, then add a blocking
`pnpm check` step to the workflow. (Until then it could be added with
`continue-on-error: true` to surface issues without blocking merges.)

### Formatting & linting

No formatter or linter is configured today. Plan:

- **Prettier** + `prettier-plugin-astro`, with a `pnpm format:check` step.
- Optionally **ESLint** with `eslint-plugin-astro` for lint rules, with a
  `pnpm lint` step.

## Planned — Tier 3 (nice to have for a public blog)

- **Lighthouse CI** over the build — performance, accessibility, SEO and
  best-practices budgets. High value for a public portfolio/blog.
- **Broken-link checking** (e.g. `lychee`) over `dist/` — the posts contain many
  external links.
- **Dependabot / Renovate** — automated dependency updates after this large
  migration.

## Project-specific caveats

- The build **fetches the Geist fonts from unpkg** while generating the OG
  images, so CI runners need outbound network access. GitHub-hosted runners have
  it; keep this in mind for any self-hosted/restricted runner.
- pnpm is provided via `pnpm/action-setup`, which reads the version from the
  `packageManager` field in `package.json`. `actions/setup-node` caches the pnpm
  store for faster installs.
