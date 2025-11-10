export type Comment = {
  id: string;
  author: string;
  body: string;
  createdAt: string; // ISO string
};

export type FileChange = {
  path: string;
  additions: number;
  deletions: number;
  patch: string[]; // unified diff-like lines beginning with '+', '-', or ' '
};

export type Commit = {
  hash: string;
  author: string;
  message: string;
  dateISO: string;
};

export type PullRequest = {
  id: string;
  title: string;
  author: string;
  description?: string;
  files: FileChange[];
  comments: Comment[];
};

export type Branch = {
  name: string;
  isCurrent?: boolean; // true if this branch is currently checked out
};

export type Repo = {
  id: string;
  name: string;
  path?: string; // local filesystem path when added as a local repo
  baseBranch?: string; // e.g., main or master
  pullRequests: PullRequest[];
  branches?: Branch[]; // optional list of local branches
  branchCommits?: Record<string, Commit[]>; // commits since base per branch
  branchFiles?: Record<string, FileChange[]>; // changed files per branch
};
