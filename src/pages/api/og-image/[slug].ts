import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

const blogEntries = await getCollection('blog');
const pages = Object.fromEntries(blogEntries.map(({ slug, data }) => [slug, data]));

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'slug',
  pages,
  getImageOptions: (slug, page) => ({
    title: page.title,
    description: page.description,
    siteName: 'Pere Montpeó',
    // You can further customize options here
  }),
});
