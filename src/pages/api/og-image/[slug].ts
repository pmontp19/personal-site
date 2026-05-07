import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';
import { getSlug } from '../../../utils/date';

const blogEntries = await getCollection('blog');
const pages = Object.fromEntries(blogEntries.map(({ id, data }) => [getSlug(id), data]));

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'slug',
  pages,
  getImageOptions: (slug, page) => ({
    title: page.title,
    description: page.description,
    siteName: 'peremontpeo.dev',
    logo: {
      path: './src/assets/avatar.png',
      size: [64],
    },
    bgGradient: [[22, 27, 34]],
    border: {
      color: [255, 188, 13],
      width: 8,
      side: 'inline-start',
    },
    padding: 80,
    font: {
      title: {
        color: [255, 255, 255],
        size: 64,
        weight: 'SemiBold',
        lineHeight: 1.2,
        families: ['Geist'],
      },
      description: {
        color: [156, 163, 175],
        size: 32,
        weight: 'Normal',
        lineHeight: 1.4,
        families: ['Geist'],
      },
    },
    fonts: [
      'https://unpkg.com/geist@1.0.0/dist/fonts/geist-sans/Geist-SemiBold.woff2',
      'https://unpkg.com/geist@1.0.0/dist/fonts/geist-sans/Geist-Regular.woff2',
    ],
  }),
});
