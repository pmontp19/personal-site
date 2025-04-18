import { createCanvas } from 'astro-og-canvas';

export async function GET() {
  const { png } = await createCanvas({
    title: 'Pere Montpeó',
    description: 'Personal site and blog',
    siteName: 'peremontpeo.com',
    // You can further customize colors, fonts, etc. if desired
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
