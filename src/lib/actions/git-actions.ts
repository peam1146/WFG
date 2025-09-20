// Server Actions for Git operations
// Handles form submissions and Git data fetching with validation

'use server';

import { ActionResult } from '@/types/actions';
import { GitCommit, GitService } from '@/types/git';
import { RealGitService } from '@/lib/services/git/real-git';
import { GitFilterFormSchema } from '@/lib/validations/git';
import { handleServerActionError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';

// Default Git service (can be injected for testing)
const defaultGitService: GitService = new RealGitService();

/**
 * Server Action to fetch Git commits based on form data
 * @param formData - Form data containing author and since date
 * @param injectedGitService - Optional Git service for testing
 * @returns ActionResult with GitCommit array or error
 */
export async function fetchGitCommits(
  formData: FormData,
  injectedGitService?: GitService
): Promise<ActionResult<GitCommit[]>> {
  let validatedData: any = null;
  let repositoryPath = '';
  
  try {
    // Extract and validate form data
    const rawData = {
      author: formData.get('author') as string,
      since: formData.get('since') as string,
    };

    // Validate using Zod schema
    validatedData = GitFilterFormSchema.parse(rawData);

    // Use injected service for testing or default service
    const gitService = injectedGitService || defaultGitService;

    // Get repository path from environment or use current directory
    repositoryPath = process.env.GIT_REPOSITORY_PATH || process.cwd();

    logger.info('fetchGitCommits started', { 
      author: validatedData.author, 
      since: validatedData.since.toISOString(),
      repositoryPath 
    });

    // Fetch commits using Git service
    const commits = await gitService.getCommits(
      validatedData.author,
      validatedData.since,
      repositoryPath
    );

    logger.serverAction('fetchGitCommits', true, { 
      author: validatedData.author,
      commitsFound: commits.length 
    });

    return {
      success: true,
      data: commits
    };

  } catch (error) {
    return handleServerActionError('fetchGitCommits', error, { 
      author: validatedData?.author,
      repositoryPath 
    });
  }
}
