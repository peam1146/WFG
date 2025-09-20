// Real Git service implementation using simple-git library
// Performs actual Git operations on the file system

import { GitCommit } from "@/types/git";
import { subDays } from "date-fns";
import { LogResult, simpleGit, SimpleGit } from "simple-git";
import { GitService } from "./git-service";

export class RealGitService implements GitService {
  private git: SimpleGit;

  constructor(repositoryPath?: string) {
    this.git = simpleGit(repositoryPath || process.cwd());
  }

  async getCommits(
    author: string,
    since: Date,
    repositoryPath: string
  ): Promise<GitCommit[]> {
    try {
      // Validate repository first
      const isValidRepo = await this.validateRepository(repositoryPath);
      if (!isValidRepo) {
        console.warn(
          "Invalid Git repository path or not a repo:",
          repositoryPath
        );
        return [];
      }

      // Set repository path
      this.git = simpleGit(repositoryPath);

      // Enforce 31-day limit as per requirements
      const maxDate = subDays(new Date(), 31);
      const effectiveSince = since > maxDate ? since : maxDate;

      // Get Git log with filters
      const authorPattern = author.trim();
      const logOptions = {
        "--since": effectiveSince.toISOString().split("T")[0], // YYYY-MM-DD format
        "--author": authorPattern,
        "--no-merges": null,
        "--regexp-ignore-case": null,
        "--all": null,
      };

      const logResult: LogResult = await this.git.log(logOptions);

      // Transform to GitCommit interface
      return logResult.all.map((commit) => ({
        hash: commit.hash,
        author: commit.author_name || "",
        email: commit.author_email || "",
        date: new Date(commit.date),
        message: commit.message,
        isMerge: false, // Already filtered out merge commits
      }));
    } catch (error) {
      console.error("Git operation failed:", error);
      return [];
    }
  }

  async validateRepository(path: string): Promise<boolean> {
    try {
      const git = simpleGit(path);
      const isRepo = await git.checkIsRepo();
      return isRepo;
    } catch (error) {
      console.error("Repository validation failed:", error);
      return false;
    }
  }
}
