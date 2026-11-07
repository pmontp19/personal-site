import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";

const root = "src/content/blog";
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const name = path.join(dir, entry.name);
        return entry.isDirectory()
          ? files(name)
          : /\.mdx?$/.test(name)
            ? [name]
            : [];
      }),
    )
  ).flat();
}
const outputs = await Promise.all(
  [
    "blog/index.html",
    "feed.xml",
    "llms.txt",
    "llms-full.txt",
    "sitemap-0.xml",
  ].map((file) => readFile(path.join("dist", file), "utf8")),
);
const exists = async (file) =>
  access(file).then(
    () => true,
    () => false,
  );
const slugs = new Set();
for (const file of await files(root)) {
  const slug = path
    .relative(root, file)
    .replace(/\.mdx?$/, "")
    .replace(/\./g, "")
    .split(path.sep)
    .join("/");
  if (slugs.has(slug)) throw new Error(`Slug duplicat: ${slug}`);
  slugs.add(slug);
  const source = await readFile(file, "utf8");
  const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) throw new Error(`Frontmatter absent: ${file}`);
  const draft = /^draft:\s*true\s*(?:#.*)?$/m.test(frontmatter[1]);
  const url = `/blog/${slug}/`;
  const paths = [
    `dist/blog/${slug}/index.html`,
    `dist/blog/${slug}.md`,
    `dist/api/og-image/${slug}.png`,
  ];
  for (const target of paths) {
    if ((await exists(target)) === draft)
      throw new Error(
        `${draft ? "Esborrany publicat" : "Fitxer absent"}: ${target}`,
      );
  }
  for (const [index, output] of outputs.entries()) {
    if (output.includes(url) === draft)
      throw new Error(
        `${draft ? "Esborrany publicat" : "URL absent"}: ${url} (sortida ${index})`,
      );
  }
}
console.log(`Sortides verificades per a ${slugs.size} apunts.`);
