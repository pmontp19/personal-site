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

export function formatHistoryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ca-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
