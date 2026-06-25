// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import externalLinks from './src/plugins/satteri-external-links.ts';
import headingIds from './src/plugins/satteri-heading-ids.ts';

export default defineConfig({
  site: 'https://peremontpeo.dev',
  integrations: [sitemap(), mdx()],
  markdown: {
    // Astro 7's native Sätteri processor. Heading slugs are generated natively;
    // the headingIds plugin reproduces remark-heading-id's `## Heading {#id}`
    // custom IDs, and externalLinks replaces the old rehype external-links plugin.
    processor: satteri({
      hastPlugins: [headingIds(), externalLinks()],
    }),
  },
});