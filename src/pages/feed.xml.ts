import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

type Context = {
    site: string;
}

export async function GET(context: Context) {
    const blog = (await getCollection('blog')).filter(
        post => !post.data.draft)

    const items = [...blog].sort((a, b) => {
        return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
    })

    return rss({
        title: 'Apunts de Pere Montpeó',
        description: 'My Blog',
        site: context.site,
        items: items.map(item => ({
            title: item.data.title,
            description: item.data.description,
            link: `/blog/${item.slug}/`,
            pubDate: new Date(item.data.date),
        })),
        customData: `<language>ca</language>`,
    })
}