import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const extractFrontmatter = (content: string): string => {
  const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
  return frontmatterMatch ? frontmatterMatch[1] : "";
};

const extractContent = (content: string): string => {
  const frontmatterText = extractFrontmatter(content);
  let cleanedContent = content.replace(/---\n([\s\S]*?)\n---/, "");

  // remove frontmatter delimiters
  cleanedContent = cleanedContent.replace(/^\s*---\s*$/gm, "");
  // cleanup mdx imports
  cleanedContent = cleanedContent.replace(
    /import\s+.*?from\s+['"].*?['"]\s*;\s*/g,
    ""
  );
  // remove mdx components
  cleanedContent = cleanedContent.replace(/<\s*\/?\s*\w+\s*\/?>/g, "");
  // remove multiple new lines
  cleanedContent = cleanedContent.replace(/\n{2,}/g, "\n");
  // remove leading and trailing new lines

  return frontmatterText + "\n" + cleanedContent.trim();
};

export const GET: APIRoute = async ({ params }) => {
  try {
    const posts = await getCollection(
      "blog",
      ({ data }) => data.draft !== true
    );
    const sortedPosts = posts.sort((a, b) => {
      return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
    });

    let llmsContent = "";

    for (const post of sortedPosts) {
      llmsContent += `--- title: ${post.data.title} description: ${post.data.description} date: ${post.data.date} ---\n\n`;
      llmsContent += `# ${post.data.title}\n`;

      const processedContent = extractContent(post.body);
      llmsContent += processedContent + "\n\n";

      llmsContent += `---\n\n`;
    }

    return new Response(llmsContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating LLM content:", error);
    return new Response("Internal Server Error", {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
};
