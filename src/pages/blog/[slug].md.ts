import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { getSlug } from "../../utils/date";
import { cleanBody } from "../../utils/llms";

// Mirror en Markdown de cada apunt: /blog/<slug>.md
// Anunciat amb <link rel="alternate" type="text/markdown"> des de la pàgina HTML.
export async function getStaticPaths() {
  const entries = await getCollection(
    "blog",
    ({ data }) => data.draft !== true,
  );
  return entries.map((entry) => ({
    params: { slug: getSlug(entry.id) },
    props: { entry: entry as CollectionEntry<"blog"> },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props;
  const slug = getSlug(entry.id);
  const markdown = [
    `# ${entry.data.title}`,
    "",
    `URL: https://peremontpeo.dev/blog/${slug}/`,
    `Data: ${entry.data.date.toISOString().slice(0, 10)}`,
    `Descripció: ${entry.data.description}`,
    "",
    cleanBody(entry.body ?? ""),
    "",
  ].join("\n");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
