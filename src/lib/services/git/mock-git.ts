// Mock Git service implementation for testing
// Returns predefined test data instead of performing actual Git operations

import { GitService } from './git-service';
import { GitCommit } from '@/types/git';

export class MockGitService implements GitService {
  private mockCommits: GitCommit[] = [];

  /**
   * Set mock commits to be returned by getCommits method
   * @param commits - Array of GitCommit objects to return
   */
  setMockCommits(commits: GitCommit[]): void {
    this.mockCommits = commits;
  }

  async getCommits(author: string, since: Date, repositoryPath: string): Promise<GitCommit[]> {
    // Filter mock commits by author and date (simulate real filtering)
    return this.mockCommits.filter(commit => {
      const matchesAuthor = commit.author === author;
      const matchesDate = commit.date >= since;
      return matchesAuthor && matchesDate;
    });
  }

  async validateRepository(path: string): Promise<boolean> {
    // Always return true for testing purposes
    return true;
  }

  /**
   * Reset mock commits to empty array
   */
  reset(): void {
    this.mockCommits = [];
  }

  /**
   * Add a single mock commit
   * @param commit - GitCommit object to add
   */
  addMockCommit(commit: GitCommit): void {
    this.mockCommits.push(commit);
  }

  /**
   * Get current mock commits (for testing purposes)
   */
  getMockCommits(): GitCommit[] {
    return [...this.mockCommits];
  }
}
