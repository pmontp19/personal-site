import { execSync } from 'child_process';
import { readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as Diff from 'diff';
import { marked } from 'marked';
import htmldiffModule from 'htmldiff-js';
// htmldiff-js has nested default exports in ESM
const htmldiff = (htmldiffModule as any).default ?? htmldiffModule;

interface CommitInfo {
  hash: string;
  date: string;
  message: string;
}

interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

interface VersionView {
  commit: CommitInfo;
  html: string;
  diffHtml: string;
  isOriginal: boolean;
  changes: DiffChange[];
}

interface GitHistoryPayload {
  versions: VersionView[];
  hasHistory: boolean;
}

const BLOG_DIR = 'src/content/blog';
const OUT_DIR = 'public/data/git-history';

marked.setOptions({ gfm: true });

function getCommits(filePath: string): CommitInfo[] {
  const paths = [filePath];
  if (filePath.endsWith('.mdx')) {
    paths.push(filePath.replace(/\.mdx$/, '.md'));
  } else if (filePath.endsWith('.md')) {
    paths.push(filePath.replace(/\.md$/, '.mdx'));
  }

  for (const p of paths) {
    try {
      const result = execSync(
        `git log --format="%H|%ad|%s" --date=short --follow -- "${p}"`,
        { encoding: 'utf-8' }
      );
      const commits = result
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [hash, date, ...rest] = line.split('|');
          return { hash, date, message: rest.join('|') };
        });
      if (commits.length > 0) return commits;
    } catch {
      // try next path
    }
  }
  return [];
}

function getFileAtCommit(filePath: string, commitHash: string): string {
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  const absolutePath = filePath.startsWith('/') ? filePath : join(process.cwd(), filePath);
  const relativePath = absolutePath.replace(repoRoot + '/', '');

  const candidates = [relativePath];
  if (relativePath.endsWith('.mdx')) {
    candidates.push(relativePath.replace(/\.mdx$/, '.md'));
  } else if (relativePath.endsWith('.md')) {
    candidates.push(relativePath.replace(/\.md$/, '.mdx'));
  }

  for (const candidate of candidates) {
    try {
      return execSync(`git show ${commitHash}:"${candidate}"`, {
        encoding: 'utf-8',
        cwd: repoRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      // try next candidate
    }
  }
  return '';
}

function removeFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, '');
}

function removeImportsAndJsx(content: string): string {
  return content
    .replace(/^import\s+.*$/gm, '')
    .replace(/<[A-Z]\w+[^>]*\/>/g, '')
    .replace(/<[A-Z]\w+[^>]*>[\s\S]*?<\/[A-Z]\w+>/g, '')
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
    const currentContent = removeFrontmatter(getFileAtCommit(filePath, commit.hash));
    const isOriginal = i === commits.length - 1;

    const html = renderMarkdown(currentContent);

    if (isOriginal) {
      versions.push({
        commit,
        html,
        diffHtml: html,
        isOriginal: true,
        changes: [{ value: currentContent }],
      });
    } else {
      const olderContent = removeFrontmatter(getFileAtCommit(filePath, commits[i + 1].hash));
      const changes: DiffChange[] = Diff.diffWords(olderContent, currentContent).map(c => {
        const change: DiffChange = { value: c.value };
        if (c.added) change.added = true;
        if (c.removed) change.removed = true;
        return change;
      });

      const hasRealChanges = changes.some(c => c.added || c.removed);
      if (!hasRealChanges) continue;

      const oldHtml = renderMarkdown(olderContent);
      const diffHtml = htmldiff.execute(oldHtml, html);

      versions.push({ commit, html, diffHtml, isOriginal: false, changes });
    }
  }

  return { versions, hasHistory: true };
}

// Main
mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(BLOG_DIR).filter(f => /\.(md|mdx)$/.test(f));
let generated = 0;

for (const file of files) {
  const filePath = join(BLOG_DIR, file);
  const slug = file.replace(/\.(md|mdx)$/, '');
  const history = generateHistory(filePath);

  if (history.hasHistory) {
    const outPath = join(OUT_DIR, `${slug}.json`);
    writeFileSync(outPath, JSON.stringify(history, null, 2) + '\n');
    console.log(`✓ ${slug} (${history.versions.length} versions)`);
    generated++;
  }
}

console.log(`\nGenerated ${generated} history file(s) in ${OUT_DIR}`);
