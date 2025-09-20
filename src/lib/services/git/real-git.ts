// Real Git service implementation using simple-git library
// Performs actual Git operations on the file system

import { simpleGit, SimpleGit, LogResult } from 'simple-git';
import { GitService } from './git-service';
import { GitCommit } from '@/types/git';
import { subDays } from 'date-fns';

export class RealGitService implements GitService {
  private git: SimpleGit;

  constructor(repositoryPath?: string) {
    this.git = simpleGit(repositoryPath || process.cwd());
  }

  async getCommits(author: string, since: Date, repositoryPath: string): Promise<GitCommit[]> {
    try {
      // Validate repository first
      const isValidRepo = await this.validateRepository(repositoryPath);
      if (!isValidRepo) {
        return [];
      }

      // Set repository path
      this.git = simpleGit(repositoryPath);

      // Enforce 31-day limit as per requirements
      const maxDate = subDays(new Date(), 31);
      const effectiveSince = since > maxDate ? since : maxDate;

      // Get Git log with filters
      const logOptions = {
        '--since': effectiveSince.toISOString().split('T')[0], // YYYY-MM-DD format
        '--until': new Date().toISOString().split('T')[0],
        '--author': author,
        '--no-merges': null,
      };

      const logResult: LogResult = await this.git.log(logOptions);

      // Transform to GitCommit interface
      return logResult.all.map(commit => ({
        hash: commit.hash,
        author: commit.author_name || '',
        email: commit.author_email || '',
        date: new Date(commit.date),
        message: commit.message,
        isMerge: false, // Already filtered out merge commits
      }));

    } catch (error) {
      console.error('Git operation failed:', error);
      return [];
    }
  }

  async validateRepository(path: string): Promise<boolean> {
    try {
      const git = simpleGit(path);
      const isRepo = await git.checkIsRepo();
      return isRepo;
    } catch (error) {
      console.error('Repository validation failed:', error);
      return false;
    }
  }
}
