// Server Actions for summary operations
// Handles summary generation, caching, and refresh functionality

'use server';

import { ActionResult } from '@/types/actions';
import { DailySummary, GitCommit, GitService } from '@/types/git';
import { RealGitService } from '@/lib/services/git/real-git';
import { DatabaseService } from '@/lib/services/database';
import { SummaryGenerationFormSchema } from '@/lib/validations/git';
import { formatThaiDate, isSameDay } from '@/lib/utils/date-formatter';
import { ZodError } from 'zod';

// Default services (can be injected for testing)
const defaultGitService: GitService = new RealGitService();
const defaultDatabaseService = new DatabaseService();

/**
 * Server Action to generate daily summaries from Git commits
 * @param formData - Form data containing author, since date, and optional refresh flag
 * @param injectedGitService - Optional Git service for testing
 * @param injectedDatabaseService - Optional database service for testing
 * @returns ActionResult with DailySummary array or error
 */
export async function generateSummaries(
  formData: FormData,
  injectedGitService?: GitService,
  injectedDatabaseService?: DatabaseService
): Promise<ActionResult<DailySummary[]>> {
  try {
    // Extract and validate form data
    const rawData = {
      author: formData.get('author') as string,
      since: formData.get('since') as string,
      refresh: formData.get('refresh') as string,
    };

    // Validate using Zod schema
    const validatedData = SummaryGenerationFormSchema.parse(rawData);

    // Use injected services for testing or default services
    const gitService = injectedGitService || defaultGitService;
    const databaseService = injectedDatabaseService || defaultDatabaseService;

    // Get repository path and URL
    const repositoryPath = process.env.GIT_REPOSITORY_PATH || process.cwd();
    const repositoryUrl = `file://${repositoryPath}`;

    // Check if we should use cached summaries (unless refresh is requested)
    if (!validatedData.refresh) {
      const existingSummaries = await databaseService.getSummaries(
        validatedData.author,
        validatedData.since,
        repositoryUrl
      );

      if (existingSummaries.length > 0) {
        return {
          success: true,
          data: existingSummaries
        };
      }
    }

    // Fetch fresh commits from Git
    const commits = await gitService.getCommits(
      validatedData.author,
      validatedData.since,
      repositoryPath
    );

    // Group commits by day and generate summaries
    const summaries = await generateDailySummariesFromCommits(
      commits,
      validatedData.author,
      repositoryUrl,
      databaseService,
      validatedData.refresh
    );

    return {
      success: true,
      data: summaries
    };

  } catch (error) {
    console.error('generateSummaries error:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      // Get the first error message from Zod
      const errorMessage = error.issues?.[0]?.message || error.message || 'Validation failed';
      return {
        success: false,
        error: errorMessage,
        code: 'VALIDATION_ERROR'
      };
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('Database')) {
      return {
        success: false,
        error: 'Database operation failed',
        code: 'DATABASE_ERROR'
      };
    }

    // Handle other errors
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summaries',
      code: 'SUMMARY_ERROR'
    };
  }
}

/**
 * Server Action to refresh existing summaries
 * @param author - Git author name
 * @param since - Start date for summaries
 * @param injectedGitService - Optional Git service for testing
 * @param injectedDatabaseService - Optional database service for testing
 * @returns ActionResult with refreshed DailySummary array or error
 */
export async function refreshSummaries(
  author: string,
  since: Date,
  injectedGitService?: GitService,
  injectedDatabaseService?: DatabaseService
): Promise<ActionResult<DailySummary[]>> {
  try {
    // Validate inputs
    if (!author || author.trim().length === 0) {
      return {
        success: false,
        error: 'Author name is required',
        code: 'VALIDATION_ERROR'
      };
    }

    // Use injected services for testing or default services
    const gitService = injectedGitService || defaultGitService;
    const databaseService = injectedDatabaseService || defaultDatabaseService;

    // Get repository path and URL
    const repositoryPath = process.env.GIT_REPOSITORY_PATH || process.cwd();
    const repositoryUrl = `file://${repositoryPath}`;

    // Fetch fresh commits from Git
    const commits = await gitService.getCommits(author, since, repositoryPath);

    // Generate fresh summaries (force refresh)
    const summaries = await generateDailySummariesFromCommits(
      commits,
      author,
      repositoryUrl,
      databaseService,
      true // Force refresh
    );

    return {
      success: true,
      data: summaries
    };

  } catch (error) {
    console.error('refreshSummaries error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh summaries',
      code: 'REFRESH_ERROR'
    };
  }
}

/**
 * Helper function to generate daily summaries from commits
 * @param commits - Array of Git commits
 * @param authorName - Author name for the summaries
 * @param repositoryUrl - Repository URL
 * @param databaseService - Database service instance
 * @param forceRefresh - Whether to force refresh existing summaries
 * @returns Promise resolving to array of DailySummary objects
 */
async function generateDailySummariesFromCommits(
  commits: GitCommit[],
  authorName: string,
  repositoryUrl: string,
  databaseService: DatabaseService,
  forceRefresh: boolean = false
): Promise<DailySummary[]> {
  // Group commits by day
  const commitsByDay = new Map<string, GitCommit[]>();

  commits.forEach(commit => {
    const dayKey = commit.date.toDateString();
    if (!commitsByDay.has(dayKey)) {
      commitsByDay.set(dayKey, []);
    }
    commitsByDay.get(dayKey)!.push(commit);
  });

  // Generate summaries for each day
  const summaries: DailySummary[] = [];

  for (const [dayKey, dayCommits] of commitsByDay.entries()) {
    const summaryDate = new Date(dayKey);
    
    // Format Thai date and create bullet points
    const thaiDate = formatThaiDate(summaryDate);
    const bulletPoints = dayCommits
      .sort((a, b) => a.date.getTime() - b.date.getTime()) // Sort by time
      .map(commit => `- ${commit.message}`);
    
    const summaryText = `${thaiDate}\n${bulletPoints.join('\n')}`;

    // Create or update summary in database
    const summaryData = {
      authorName,
      summaryDate,
      summaryText,
      repositoryUrl
    };

    let summary: DailySummary;
    if (forceRefresh) {
      summary = await databaseService.upsertSummary(summaryData);
    } else {
      summary = await databaseService.createSummary(summaryData);
    }

    summaries.push(summary);
  }

  // Sort summaries by date
  return summaries.sort((a, b) => a.summaryDate.getTime() - b.summaryDate.getTime());
}
