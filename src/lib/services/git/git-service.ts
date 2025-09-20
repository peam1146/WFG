// GitService interface for dependency injection
// Allows easy swapping between real Git operations and mock implementations for testing

import { GitCommit } from '@/types/git';

export interface GitService {
  /**
   * Retrieve Git commits filtered by author and date range
   * @param author - Git author name to filter by
   * @param since - Start date for commit history
   * @param repositoryPath - Path to the Git repository
   * @returns Promise resolving to array of GitCommit objects
   */
  getCommits(author: string, since: Date, repositoryPath: string): Promise<GitCommit[]>;

  /**
   * Validate if the given path contains a valid Git repository
   * @param path - Path to check for Git repository
   * @returns Promise resolving to boolean indicating if valid Git repo
   */
  validateRepository(path: string): Promise<boolean>;
}
