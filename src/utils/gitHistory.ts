import { execSync } from 'child_process';
import * as Diff from 'diff';

export interface CommitInfo {
  hash: string;
  date: string;
  message: string;
}

export interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface VersionDiff {
  commit: CommitInfo;
  changes: DiffChange[];
  isOriginal: boolean;
}

export interface GitHistoryData {
  versions: VersionDiff[];
  hasHistory: boolean;
}

/**
 * Get git commits for a specific file
 */
function getCommits(filePath: string): CommitInfo[] {
  try {
    const result = execSync(
      `git log --format="%H|%ad|%s" --date=short --follow -- "${filePath}"`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    
    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, date, message] = line.split('|');
        return { hash, date, message };
      });
  } catch {
    return [];
  }
}

/**
 * Get file content at a specific commit
 */
function getFileAtCommit(filePath: string, commitHash: string): string {
  try {
    // Get the relative path from repo root
    const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    const absolutePath = filePath.startsWith('/') ? filePath : `${process.cwd()}/${filePath}`;
    const relativePath = absolutePath.replace(repoRoot + '/', '');
    
    return execSync(`git show ${commitHash}:"${relativePath}"`, {
      encoding: 'utf-8',
      cwd: repoRoot
    });
  } catch {
    return '';
  }
}

/**
 * Remove frontmatter from markdown content
 */
function removeFrontmatter(content: string): string {
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n*/;
  return content.replace(frontmatterRegex, '');
}

/**
 * Generate word-level diff between two texts
 */
function generateWordDiff(oldText: string, newText: string): DiffChange[] {
  return Diff.diffWords(oldText, newText);
}

/**
 * Get git history with diffs for a blog post file
 */
export function getGitHistory(filePath: string): GitHistoryData {
  const commits = getCommits(filePath);
  
  if (commits.length <= 1) {
    return { versions: [], hasHistory: false };
  }
  
  const versions: VersionDiff[] = [];
  
  // Process commits from newest to oldest
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const currentContent = removeFrontmatter(getFileAtCommit(filePath, commit.hash));
    const isOriginal = i === commits.length - 1;
    
    if (isOriginal) {
      // Original version - no diff, just show as original
      versions.push({
        commit,
        changes: [{ value: currentContent }],
        isOriginal: true
      });
    } else {
      // Compare with previous (older) version
      const olderCommit = commits[i + 1];
      const olderContent = removeFrontmatter(getFileAtCommit(filePath, olderCommit.hash));
      const changes = generateWordDiff(olderContent, currentContent);
      
      versions.push({
        commit,
        changes,
        isOriginal: false
      });
    }
  }
  
  return { versions, hasHistory: true };
}

/**
 * Format a date string to Catalan locale
 */
export function formatHistoryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ca-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}
