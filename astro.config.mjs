// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from './src/plugins/rehype-external-links.ts';

export default defineConfig({
  site: 'https://peremontpeo.dev',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeExternalLinks],
  },
});