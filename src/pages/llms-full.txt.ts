import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getSlug } from "../utils/date";
import { cleanBody } from "../utils/llms";

// Bolcat complet de tots els apunts en text pla.
// L'índex curt viu a /llms.txt; cada apunt també té mirror a /blog/<slug>.md.
const SITE = "https://peremontpeo.dev";

export const GET: APIRoute = async () => {
  try {
    const posts = (
      await getCollection("blog", ({ data }) => data.draft !== true)
    ).sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
    );

    let content = `# Pere Montpeó — tots els apunts\n\n> Índex navegable: ${SITE}/llms.txt\n`;

    for (const post of posts) {
      content += `\n\n# ${post.data.title}\n\n`;
      content += `URL: ${SITE}/blog/${getSlug(post.id)}/\n`;
      content += `Data: ${post.data.date.toISOString().slice(0, 10)}\n`;
      content += `Descripció: ${post.data.description}\n\n`;
      content += `${cleanBody(post.body ?? "")}\n\n---`;
    }
    content += "\n";

    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating LLM full content:", error);
    return new Response("Internal Server Error", {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
};
