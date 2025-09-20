// Server Actions for summary operations
// Handles summary generation, caching, and refresh functionality

"use server";

import { getAIConfigService } from "@/lib/services/ai-config";
import { AIService } from "@/lib/services/ai/ai-service";
import { MockAIService } from "@/lib/services/ai/mock-ai";
import { OpenRouterAIService } from "@/lib/services/ai/openrouter-ai";
import { DatabaseService } from "@/lib/services/database";
import { RealGitService } from "@/lib/services/git/real-git";
import { formatThaiDate } from "@/lib/utils/date-formatter";
import { logger } from "@/lib/utils/logger";
import { SummaryGenerationFormSchema } from "@/lib/validations/git";
import { ActionResult } from "@/types/actions";
import { EnhancedDailySummary } from "@/types/ai";
import { DailySummary, GitCommit, GitService } from "@/types/git";
import { ZodError } from "zod";

// Default services (can be injected for testing)
const defaultGitService: GitService = new RealGitService();
const defaultDatabaseService = new DatabaseService();

/**
 * Server Action to generate daily summaries from Git commits with optional AI enhancement
 * @param formData - Form data containing author, since date, optional refresh flag, and useAI flag
 * @param injectedServices - Optional services for testing
 * @returns ActionResult with EnhancedDailySummary array or error
 */
export async function generateSummaries(
  formData: FormData,
  injectedServices?: {
    gitService?: GitService;
    databaseService?: DatabaseService;
    aiService?: AIService;
  }
): Promise<ActionResult<EnhancedDailySummary[]>> {
  try {
    // Extract and validate form data
    const rawData = {
      author: formData.get("author") as string,
      since: formData.get("since") as string,
      refresh: formData.get("refresh") as string,
      useAI: formData.get("useAI") as string,
    };

    // Validate using Zod schema
    const validatedData = SummaryGenerationFormSchema.parse(rawData);

    // Use injected services for testing or default services
    const gitService = injectedServices?.gitService || defaultGitService;
    const databaseService =
      injectedServices?.databaseService || defaultDatabaseService;
    const aiService = injectedServices?.aiService || (await createAIService());

    // Get repository path and URL
    const repositoryPath = process.env.GIT_REPOSITORY_PATH || process.cwd();
    const repositoryUrl = `file://${repositoryPath}`;

    // Check if we should use cached summaries (unless refresh is requested)
    if (!validatedData.refresh) {
      const existingSummaries = await databaseService.getDailySummaries(
        validatedData.author,
        validatedData.since,
        repositoryUrl
      );

      if (existingSummaries.length > 0) {
        return {
          success: true,
          data: existingSummaries,
        };
      }
    }

    // Fetch fresh commits from Git
    const commits = await gitService.getCommits(
      validatedData.author,
      validatedData.since,
      repositoryPath
    );

    // Determine if AI should be used
    const useAI = validatedData.useAI && getAIConfigService().isAIEnabled();

    // Group commits by day and generate summaries with optional AI enhancement
    const summaries = await generateEnhancedDailySummariesFromCommits(
      commits,
      validatedData.author,
      repositoryUrl,
      databaseService,
      aiService,
      validatedData.refresh,
      useAI
    );

    return {
      success: true,
      data: summaries,
    };
  } catch (error) {
    console.error("generateSummaries error:", error);

    // Handle validation errors
    if (error instanceof ZodError) {
      // Get the first error message from Zod
      const errorMessage =
        error.issues?.[0]?.message || error.message || "Validation failed";
      return {
        success: false,
        error: errorMessage,
        code: "VALIDATION_ERROR",
      };
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes("Database")) {
      return {
        success: false,
        error: "Database operation failed",
        code: "DATABASE_ERROR",
      };
    }

    // Handle other errors
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate summaries",
      code: "SUMMARY_ERROR",
    };
  }
}

/**
 * Server Action to refresh existing summaries with AI enhancement
 * @param author - Git author name
 * @param since - Start date for summaries
 * @param injectedServices - Optional services for testing
 * @returns ActionResult with refreshed EnhancedDailySummary array or error
 */
export async function refreshSummaries(
  author: string,
  since: Date,
  injectedServices?: {
    gitService?: GitService;
    databaseService?: DatabaseService;
    aiService?: AIService;
  }
): Promise<ActionResult<EnhancedDailySummary[]>> {
  try {
    // Validate inputs
    if (!author || author.trim().length === 0) {
      return {
        success: false,
        error: "Author name is required",
        code: "VALIDATION_ERROR",
      };
    }

    // Use injected services for testing or default services
    const gitService = injectedServices?.gitService || defaultGitService;
    const databaseService =
      injectedServices?.databaseService || defaultDatabaseService;
    const aiService = injectedServices?.aiService || (await createAIService());

    // Get repository path and URL
    const repositoryPath = process.env.GIT_REPOSITORY_PATH || process.cwd();
    const repositoryUrl = `file://${repositoryPath}`;

    // Diagnostics
    logger.info("refreshSummaries started", {
      author,
      since: since.toISOString(),
      repositoryPath,
    });

    // Fetch fresh commits from Git
    const commits = await gitService.getCommits(author, since, repositoryPath);

    logger.info("refreshSummaries getCommits", {
      author,
      commitsFound: commits.length,
    });

    // If no commits found, return existing cached summaries to avoid clearing the UI
    if (commits.length === 0) {
      const existingSummaries = await databaseService.getDailySummaries(
        author,
        since,
        repositoryUrl
      );

      return {
        success: true,
        data: existingSummaries,
      };
    }

    // Determine if AI should be used
    const useAI = getAIConfigService().isAIEnabled();

    // Generate fresh enhanced summaries (force refresh with AI)
    const summaries = await generateEnhancedDailySummariesFromCommits(
      commits,
      author,
      repositoryUrl,
      databaseService,
      aiService,
      true, // Force refresh
      useAI
    );

    return {
      success: true,
      data: summaries,
    };
  } catch (error) {
    console.error("refreshSummaries error:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to refresh summaries",
      code: "REFRESH_ERROR",
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

  commits.forEach((commit) => {
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
      .map((commit) => `- ${commit.message}`);

    const summaryText = `${thaiDate}\n${bulletPoints.join("\n")}`;

    // Create or update summary in database
    const summaryData = {
      authorName,
      summaryDate,
      summaryText,
      repositoryUrl,
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
  return summaries.sort(
    (a, b) => a.summaryDate.getTime() - b.summaryDate.getTime()
  );
}

/**
 * Helper function to create AI service instance
 * @returns Promise resolving to AIService instance
 */
async function createAIService(): Promise<AIService> {
  const configService = getAIConfigService();

  if (!configService.isAIEnabled()) {
    return new MockAIService();
  }

  try {
    const config = configService.getEnvironmentConfig();
    return new OpenRouterAIService({
      apiKey: config.apiKey,
      timeout: config.timeout,
    });
  } catch (error) {
    logger.warn("Failed to create AI service, using mock", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new MockAIService();
  }
}

/**
 * Enhanced helper function to generate daily summaries with AI integration
 * @param commits - Array of Git commits
 * @param authorName - Author name for the summaries
 * @param repositoryUrl - Repository URL
 * @param databaseService - Database service instance
 * @param aiService - AI service instance
 * @param forceRefresh - Whether to force refresh existing summaries
 * @param useAI - Whether to use AI enhancement
 * @returns Promise resolving to array of EnhancedDailySummary objects
 */
async function generateEnhancedDailySummariesFromCommits(
  commits: GitCommit[],
  authorName: string,
  repositoryUrl: string,
  databaseService: DatabaseService,
  aiService: AIService,
  forceRefresh: boolean = false,
  useAI: boolean = true
): Promise<EnhancedDailySummary[]> {
  // Group commits by day
  const commitsByDay = new Map<string, GitCommit[]>();

  commits.forEach((commit) => {
    const dayKey = commit.date.toDateString();
    if (!commitsByDay.has(dayKey)) {
      commitsByDay.set(dayKey, []);
    }
    commitsByDay.get(dayKey)!.push(commit);
  });

  // Generate summaries for each day
  const summaries: EnhancedDailySummary[] = [];

  for (const [dayKey, dayCommits] of commitsByDay.entries()) {
    const summaryDate = new Date(dayKey);

    // Check for existing AI summary unless forcing refresh
    let existingAISummary = null;
    if (!forceRefresh && useAI) {
      existingAISummary = await databaseService.getAISummary(
        authorName,
        summaryDate
      );

      // Verify commit hashes match (cache invalidation)
      if (existingAISummary) {
        const existingHashes = JSON.parse(existingAISummary.commitHashList);
        const currentHashes = dayCommits.map((c) => c.hash).sort();
        const hashesMatch =
          existingHashes.length === currentHashes.length &&
          existingHashes
            .sort()
            .every(
              (hash: string, index: number) => hash === currentHashes[index]
            );

        if (!hashesMatch) {
          // Hashes don't match, invalidate cache
          await databaseService.deleteAISummaries(authorName, summaryDate);
          existingAISummary = null;
        }
      }
    }

    // Generate basic summary text
    const thaiDate = formatThaiDate(summaryDate);
    const bulletPoints = dayCommits
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((commit) => `- ${commit.message}`);
    const basicSummaryText = `${thaiDate}\n${bulletPoints.join("\n")}`;

    let aiSummaryId: number | undefined;
    let aiSummaryText: string | undefined;
    let aiModelUsed: string | undefined;

    // Generate or use existing AI summary
    if (useAI && !existingAISummary) {
      try {
        const configService = getAIConfigService();
        const generationConfig = configService.getGenerationConfig();

        logger.info("Generating AI summary", {
          author: authorName,
          date: summaryDate.toISOString(),
          commitCount: dayCommits.length,
        });

        const aiSummary = await aiService.generateSummary(
          dayCommits,
          generationConfig
        );

        if (aiSummary && aiSummary.trim().length > 0) {
          // Save AI summary to database
          const savedAISummary = await databaseService.saveAISummary({
            authorName,
            summaryDate,
            commitHashList: dayCommits.map((c) => c.hash),
            aiSummaryText: aiSummary,
            modelUsed: generationConfig.model,
          });

          aiSummaryId = savedAISummary.id;
          aiSummaryText = aiSummary;
          aiModelUsed = generationConfig.model;

          // Record API usage
          await databaseService.recordAPIUsage({
            modelUsed: generationConfig.model,
            tokensUsed: Math.floor(aiSummary.length / 4), // Rough estimation
            requestDuration: 2000, // Placeholder - would be measured in real implementation
            requestStatus: "success",
            authorName,
          });

          logger.info("AI summary generated successfully", {
            author: authorName,
            date: summaryDate.toISOString(),
            model: generationConfig.model,
            summaryLength: aiSummary.length,
          });
        }
      } catch (error) {
        logger.warn("AI summary generation failed, using basic summary", {
          author: authorName,
          date: summaryDate.toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });

        // Record API usage failure
        await databaseService.recordAPIUsage({
          modelUsed: getAIConfigService().getGenerationConfig().model,
          tokensUsed: 0,
          requestDuration: 1000,
          requestStatus: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
          authorName,
        });
      }
    } else if (existingAISummary) {
      // Use existing AI summary
      aiSummaryId = existingAISummary.id;
      aiSummaryText = existingAISummary.aiSummaryText;
      aiModelUsed = existingAISummary.modelUsed;

      logger.debug("Using cached AI summary", {
        author: authorName,
        date: summaryDate.toISOString(),
        aiSummaryId,
      });
    }

    // Save daily summary with AI enhancement
    const summary = await databaseService.saveDailySummary(
      {
        authorName,
        summaryDate,
        summaryText: basicSummaryText,
        repositoryUrl,
      },
      aiSummaryId
    );

    summaries.push(summary);
  }

  // Sort summaries by date
  return summaries.sort(
    (a, b) => a.summaryDate.getTime() - b.summaryDate.getTime()
  );
}
