// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import { satteri } from "@astrojs/markdown-satteri";
import externalLinks from "./src/plugins/satteri-external-links.ts";
import headingIds from "./src/plugins/satteri-heading-ids.ts";

export default defineConfig({
  site: "https://peremontpeo.dev",
  integrations: [sitemap(), mdx()],
  vite: {
    resolve: {
      // Astro 7 imports `parseCookie` from cookie@2 (ESM). pnpm doesn't hoist
      // cookie to the project root, so Vite externalizes it only if *some*
      // ancestor node_modules has a copy, e.g. a stray cookie@0.7 (CJS) in
      // ~/node_modules, and the prerender step then crashes with "Named export
      // 'parseCookie' not found". Always bundling it gives the same build
      // locally and on CI (where nothing is found and it already gets bundled).
      // Under `resolve` (not `ssr`) so it reaches Astro 7's prerender environment.
      noExternal: ["cookie"],
    },
  },
  markdown: {
    // Astro 7's native Sätteri processor. Heading slugs are generated natively;
    // the headingIds plugin reproduces remark-heading-id's `## Heading {#id}`
    // custom IDs (Sätteri's native `headingAttributes` is buggy in 0.9.2), and
    // externalLinks replaces the old rehype external-links plugin. Smart
    // punctuation enables ellipses/dashes but skips curly quotes to preserve
    // Catalan apostrophes (l'AI, d'ús).
    processor: satteri({
      features: {
        smartPunctuation: { quotes: false, dashes: true, ellipses: true },
      },
      hastPlugins: [headingIds(), externalLinks()],
    }),
  },
});
