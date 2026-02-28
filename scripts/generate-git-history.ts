import { execSync } from 'child_process';
import { readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as Diff from 'diff';

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

interface VersionDiff {
  commit: CommitInfo;
  changes: DiffChange[];
  isOriginal: boolean;
}

interface GitHistoryData {
  versions: VersionDiff[];
  hasHistory: boolean;
}

const BLOG_DIR = 'src/content/blog';
const OUT_DIR = 'src/data/git-history';

function getCommits(filePath: string): CommitInfo[] {
  // Try current path and alternate extension to handle .md <-> .mdx renames
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

  // Try current path, then alternate extension (.md <-> .mdx)
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

function generateHistory(filePath: string): GitHistoryData {
  const commits = getCommits(filePath);

  if (commits.length <= 1) {
    return { versions: [], hasHistory: false };
  }

  const versions: VersionDiff[] = [];

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const currentContent = removeFrontmatter(getFileAtCommit(filePath, commit.hash));
    const isOriginal = i === commits.length - 1;

    if (isOriginal) {
      versions.push({
        commit,
        changes: [{ value: currentContent }],
        isOriginal: true,
      });
    } else {
      const olderContent = removeFrontmatter(getFileAtCommit(filePath, commits[i + 1].hash));
      const changes: DiffChange[] = Diff.diffWords(olderContent, currentContent).map(c => {
        const change: DiffChange = { value: c.value };
        if (c.added) change.added = true;
        if (c.removed) change.removed = true;
        return change;
      });

      // Skip commits with no actual content changes (e.g. frontmatter-only edits)
      const hasRealChanges = changes.some(c => c.added || c.removed);
      if (!hasRealChanges) continue;

      versions.push({ commit, changes, isOriginal: false });
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

console.log(`\nGenerated ${generated} history file(s).`);
