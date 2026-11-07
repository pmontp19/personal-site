import { getCollection } from "astro:content";
import { getSlug } from "./date";

export const tagNames = {
  "agents-ia": "Agents i IA",
  projectes: "Projectes",
  enginyeria: "Enginyeria",
} as const;

export async function publishedPosts() {
  const entries = await getCollection("blog");
  const slugs = new Set<string>();
  for (const entry of entries) {
    const slug = getSlug(entry.id);
    if (slugs.has(slug)) throw new Error(`Slug duplicat: ${slug}`);
    slugs.add(slug);
  }
  return entries.filter((entry) => entry.data.draft !== true);
}
