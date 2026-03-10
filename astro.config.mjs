// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import remarkHeadingId from 'remark-heading-id';
import rehypeExternalLinks from './src/plugins/rehype-external-links.ts';

export default defineConfig({
  site: 'https://peremontpeo.dev',
  integrations: [sitemap(), mdx()],
  markdown: {
    remarkPlugins: [remarkHeadingId],
    rehypePlugins: [rehypeSlug, rehypeExternalLinks],
  },
});