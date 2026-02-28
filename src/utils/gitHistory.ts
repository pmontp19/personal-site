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

export interface VersionView {
  commit: CommitInfo;
  html: string;
  diffHtml: string;
  isOriginal: boolean;
  changes: DiffChange[];
}

export interface GitHistoryPayload {
  versions: VersionView[];
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
