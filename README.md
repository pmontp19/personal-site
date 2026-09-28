# peremontpeo.dev

Lloc web personal i blog de Pere Montpeó: [peremontpeo.dev](https://peremontpeo.dev).

Fet amb [Astro](https://astro.build) com a lloc estàtic. L'estètica és de
«fitxer de text» (monospace, separadors `~~~`, un únic accent ambre); la font de
veritat del disseny és [`docs/design.md`](docs/design.md).

## Requisits

- Node `>= 22.12`
- [pnpm](https://pnpm.io) (versió fixada a `packageManager` de `package.json`)

## Ordres

| Ordre                   | Què fa                                                  |
| :---------------------- | :------------------------------------------------------ |
| `pnpm install`          | Instal·la les dependències                              |
| `pnpm dev`              | Servidor de desenvolupament a `localhost:4321`          |
| `pnpm build`            | Genera el lloc a `./dist/`                              |
| `pnpm preview`          | Serveix el build localment                              |
| `pnpm check`            | Comprovació de tipus (`astro check`)                    |
| `pnpm lint`             | ESLint                                                  |
| `pnpm format`           | Formata amb Prettier (`format:check` només comprova)    |
| `pnpm generate-history` | Genera l'historial de versions dels apunts a partir del git |

## Estructura

```text
src/
├── content/
│   ├── blog/          # apunts (.md / .mdx)
│   ├── experience/    # entrades d'experiència laboral
│   └── cv/            # CV en ca / es / en
├── components/        # components Astro
├── layouts/Layout.astro
├── pages/             # rutes: /, /blog, /experiencia, /cv, feed.xml, llms.txt, OG images…
├── plugins/           # plugins del processador Markdown (Sätteri)
├── styles/global.css  # tokens i primitives del disseny
└── utils/
docs/                  # spec de disseny i plans
scripts/               # scripts auxiliars (historial git dels apunts)
```

## Contingut

- **Apunts:** un fitxer a `src/content/blog/` amb `title`, `description` i `date`
  al frontmatter (opcionals: `lastUpdated`, `draft`, `image`, `imageAlt`).
  L'esquema és a `src/content.config.ts`.
- **Experiència:** un fitxer a `src/content/experience/` amb `company`, `role`,
  `startDate` i, si escau, `endDate`.

El build genera també el feed RSS (`/feed.xml`), el sitemap, `llms.txt` i les
imatges Open Graph de cada apunt.

## CI

Cada PR a `main` passa per [`.github/workflows/ci.yml`](.github/workflows/ci.yml):
instal·lació amb lockfile, `format:check`, `lint`, `check` i `build`. Vegeu
[`docs/plans/ci-checks-roadmap.md`](docs/plans/ci-checks-roadmap.md).
