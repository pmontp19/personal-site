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

The workflow now runs three more blocking steps after the install, before the
build:

| Check | Command | Catches |
| --- | --- | --- |
| Formatting | `pnpm format:check` | Prettier formatting drift |
| Linting | `pnpm lint` | unused vars, `no-explicit-any`, unused expressions and other ESLint findings |
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

### Linting — ESLint

Now enabled and **blocking**. A flat config (`eslint.config.js`) layers
`@eslint/js` recommended, `typescript-eslint` recommended and
`eslint-plugin-astro` recommended, with browser + node globals and a
`no-unused-vars` rule that allows `_`-prefixed identifiers. `pnpm lint` runs
`eslint .` (build output, generated types and `public/` are ignored).

The 5 findings surfaced on first run were fixed:

- `scripts/generate-git-history.ts` — replaced the `as any` htmldiff-js cast
  with a typed `{ default?: ... }` cast (`no-explicit-any`).
- `src/components/ExperienceEntry.astro` + `src/pages/experiencia.astro` —
  dropped the unused `index` prop end to end (`no-unused-vars`).
- `src/components/LanguageSwitcher.astro` — removed the unused `labels` map.
- `src/pages/llms.txt.ts` — dropped the unused `params` handler argument.
- `src/layouts/Layout.astro` — annotated the intentional reflow-forcing
  expression with an `eslint-disable-next-line` comment (`no-unused-expressions`).

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
