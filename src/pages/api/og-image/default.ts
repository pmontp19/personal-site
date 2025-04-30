import { OGImageRoute } from 'astro-og-canvas';

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'default', // Provide a string, even if not used in the route
  pages: {
    'default': {
      title: 'Pere Montpeó',
      description: 'Personal site and blog',
      siteName: 'peremontpeo.com',
    },
  },
  getImageOptions: (key, page) => ({
    title: page.title,
    description: page.description,
    siteName: page.siteName,
  }),
});
