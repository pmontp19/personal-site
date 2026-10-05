import { execFileSync } from "child_process";
import { readdirSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { marked } from "marked";
import htmldiffModule from "htmldiff-js";
// htmldiff-js has a nested default export under some ESM interop paths.
const htmldiff =
  (htmldiffModule as { default?: typeof htmldiffModule }).default ??
  htmldiffModule;

interface CommitInfo {
  hash: string;
  date: string;
  message: string;
}

interface VersionView {
  commit: CommitInfo;
  html: string;
  diffHtml?: string; // omitted on the original version (same as html)
  isOriginal: boolean;
}

interface GitHistoryPayload {
  versions: VersionView[];
  hasHistory: boolean;
}

const BLOG_DIR = "src/content/blog";
const OUT_DIR = "public/data/git-history";

marked.setOptions({ gfm: true });

function getCommits(filePath: string): CommitInfo[] {
  const paths = [filePath];
  if (filePath.endsWith(".mdx")) {
    paths.push(filePath.replace(/\.mdx$/, ".md"));
  } else if (filePath.endsWith(".md")) {
    paths.push(filePath.replace(/\.md$/, ".mdx"));
  }

  for (const p of paths) {
    try {
      const result = execFileSync(
        "git",
        ["log", "--format=%H|%ad|%s", "--date=short", "--follow", "--", p],
        { encoding: "utf-8" },
      );
      const commits = result
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [hash, date, ...rest] = line.split("|");
          return { hash, date, message: rest.join("|") };
        });
      if (commits.length > 0) return commits;
    } catch {
      // try next path
    }
  }
  return [];
}

const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf-8",
}).trim();

function getFileAtCommit(filePath: string, commitHash: string): string {
  const absolutePath = filePath.startsWith("/")
    ? filePath
    : join(process.cwd(), filePath);
  const relativePath = absolutePath.replace(repoRoot + "/", "");

  const candidates = [relativePath];
  if (relativePath.endsWith(".mdx")) {
    candidates.push(relativePath.replace(/\.mdx$/, ".md"));
  } else if (relativePath.endsWith(".md")) {
    candidates.push(relativePath.replace(/\.md$/, ".mdx"));
  }

  for (const candidate of candidates) {
    try {
      return execFileSync("git", ["show", `${commitHash}:${candidate}`], {
        encoding: "utf-8",
        cwd: repoRoot,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      // try next candidate
    }
  }
  return "";
}

function removeFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, "");
}

function removeImportsAndJsx(content: string): string {
  return content
    .replace(/^import\s+.*$/gm, "")
    .replace(/<[A-Z]\w+[^>]*\/>/g, "")
    .replace(/<[A-Z]\w+[^>]*>[\s\S]*?<\/[A-Z]\w+>/g, "")
    .trim();
}

function renderMarkdown(md: string): string {
  const clean = removeImportsAndJsx(md);
  return marked.parse(clean, { async: false }) as string;
}

function generateHistory(filePath: string): GitHistoryPayload {
  const commits = getCommits(filePath);

  if (commits.length <= 1) {
    return { versions: [], hasHistory: false };
  }

  const versions: VersionView[] = [];

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const currentContent = removeFrontmatter(
      getFileAtCommit(filePath, commit.hash),
    );
    const isOriginal = i === commits.length - 1;

    const html = renderMarkdown(currentContent);

    if (isOriginal) {
      versions.push({ commit, html, isOriginal: true });
    } else {
      const olderContent = removeFrontmatter(
        getFileAtCommit(filePath, commits[i + 1].hash),
      );
      const oldHtml = renderMarkdown(olderContent);
      const diffHtml = htmldiff.execute(oldHtml, html);

      // Skip commits that don't change the rendered post
      if (!/<(ins|del)\b/.test(diffHtml)) continue;

      versions.push({ commit, html, diffHtml, isOriginal: false });
    }
  }

  return { versions, hasHistory: true };
}

// Main
mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(BLOG_DIR).filter((f) => /\.(md|mdx)$/.test(f));
let generated = 0;

for (const file of files) {
  const filePath = join(BLOG_DIR, file);
  const slug = file.replace(/\.(md|mdx)$/, "");
  const history = generateHistory(filePath);

  if (history.hasHistory) {
    const outPath = join(OUT_DIR, `${slug}.json`);
    writeFileSync(outPath, JSON.stringify(history));
    console.log(`✓ ${slug} (${history.versions.length} versions)`);
    generated++;
  }
}

console.log(`\nGenerated ${generated} history file(s) in ${OUT_DIR}`);
