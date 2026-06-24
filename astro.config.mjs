// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import rehypeSlug from 'rehype-slug';
import remarkHeadingId from 'remark-heading-id';
import rehypeExternalLinks from './src/plugins/rehype-external-links.ts';

export default defineConfig({
  site: 'https://peremontpeo.dev',
  integrations: [sitemap(), mdx()],
  markdown: {
    // Astro 7 makes Sätteri the default Markdown processor. This site relies on
    // the remark/rehype plugin ecosystem, so opt back into the unified pipeline
    // and pass the plugins directly to it (top-level *Plugins options are deprecated).
    processor: unified({
      remarkPlugins: [remarkHeadingId],
      rehypePlugins: [rehypeSlug, rehypeExternalLinks],
    }),
  },
});