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

## Implemented — Tier 2 (code quality)

The workflow now runs two more blocking steps after the install, before the
build:

| Check | Command | Catches |
| --- | --- | --- |
| Formatting | `pnpm format:check` | Prettier formatting drift |
| Type checking | `pnpm check` | `string \| undefined` misuse, bad component props, missing module types — errors a plain `pnpm build` does not surface |

### Type checking — `astro check`

Now enabled and **blocking**. `@astrojs/check` + `typescript` are dev
dependencies and `"check": "astro check"` is a script.

The roadmap originally counted 6 pre-existing type errors; a 7th surfaced once
the check actually ran (a `hast` module-resolution error in the external-links
plugin). All were fixed:

- `scripts/generate-git-history.ts` (`ts7016`) — added a
  `declare module 'htmldiff-js'` ambient declaration in `src/types/shims.d.ts`.
- `src/layouts/Layout.astro` (`ts2882`) — ambient declarations for the
  side-effect `@fontsource/geist-sans` / `@fontsource/geist-mono` imports
  (same `src/types/shims.d.ts`).
- `src/plugins/satteri-external-links.ts` (`ts2307`) — added the `@types/hast`
  dev dependency for `import type { Element } from 'hast'`.
- `src/components/BlogPosts.astro`, `src/pages/llms.txt.ts` (`ts2345`) — guarded
  the optional `entry.body` with `?? ""`.
- `src/pages/index.astro` / `src/components/ExperienceTimeline.astro` (`ts2322`)
  — typed the `experiences` prop as `CollectionEntry<"experience">[]` so it
  matches what `getCollection("experience")` returns, instead of a hand-written
  `Experience[]` that required a non-existent `slug`.

`astro check` still reports ~25 non-blocking **hints** (unused params, a
deprecated Zod export). These do not fail CI — `astro check` exits non-zero only
on errors.

### Formatting — Prettier

**Prettier** + `prettier-plugin-astro` are configured (`.prettierrc.json`,
`.prettierignore`) with `pnpm format` (write) and `pnpm format:check` (CI)
scripts. Build output and authored prose (`dist/`, `.astro/`, `public/`,
`src/content/`, `*.md`, `*.mdx`) are excluded so the formatter only touches code.
The source tree was formatted once so `format:check` is green.

### Linting — ESLint (still planned, optional)

Not yet configured. Plan: ESLint flat config with `eslint-plugin-astro` +
`typescript-eslint` and a `pnpm lint` step.

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
