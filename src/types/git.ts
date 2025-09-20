// Git-related type definitions for WFG Git Log Viewer

export interface GitCommit {
  hash: string;           // Git commit SHA
  author: string;         // Commit author name
  email: string;          // Author email
  date: Date;            // Commit date
  message: string;       // Commit message
  isMerge: boolean;      // Whether this is a merge commit
}

export interface DailySummary {
  id: string;
  authorName: string;
  summaryDate: Date;
  summaryText: string;
  repositoryUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterCriteria {
  authorName: string;
  sinceDate: Date;
  repositoryPath: string;
}

export interface DailySummaryGroup {
  date: Date;
  commits: GitCommit[];
  formattedDate: string;
  bulletPoints: string[];
  summaryText: string;
}

// Git service interface for dependency injection
export interface GitService {
  getCommits(author: string, since: Date, repositoryPath: string): Promise<GitCommit[]>;
  validateRepository(path: string): Promise<boolean>;
}
