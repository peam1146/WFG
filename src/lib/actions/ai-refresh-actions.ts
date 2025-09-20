// AI Refresh Server Actions
// Server Actions for refreshing AI-enhanced worklog summaries

'use server';

import { ActionResult } from '@/types/actions';
import { EnhancedDailySummary } from '@/types/ai';
import { GitService } from '@/types/git';
import { RealGitService } from '@/lib/services/git/real-git';
import { DatabaseService } from '@/lib/services/database';
import { AIService } from '@/lib/services/ai/ai-service';
import { OpenRouterAIService } from '@/lib/services/ai/openrouter-ai';
import { MockAIService } from '@/lib/services/ai/mock-ai';
import { getAIConfigService } from '@/lib/services/ai-config';
import { formatThaiDate } from '@/lib/utils/date-formatter';
import { logger } from '@/lib/utils/logger';

// Default services (can be injected for testing)
const defaultGitService: GitService = new RealGitService();
const defaultDatabaseService = new DatabaseService();

/**
 * Server Action to refresh AI-enhanced summaries (clear cache and regenerate)
 * @param author - Git author name
 * @param since - Start date for refresh
 * @param injectedServices - Optional services for testing
 * @returns ActionResult with refreshed EnhancedDailySummary array or error
 */
export async function refreshAISummaries(
  author: string,
  since: Date,
  injectedServices?: {
    gitService?: GitService;
    aiService?: AIService;
    databaseService?: DatabaseService;
  }
): Promise<ActionResult<EnhancedDailySummary[]>> {
  try {
    // Validate inputs
    if (!author || author.trim().length === 0) {
      return {
        success: false,
        error: 'Author name is required',
        code: 'VALIDATION_ERROR'
      };
    }

    if (!since || since > new Date()) {
      return {
        success: false,
        error: 'Valid since date is required and cannot be in the future',
        code: 'VALIDATION_ERROR'
      };
    }

    // Use injected services for testing or default services
    const gitService = injectedServices?.gitService || defaultGitService;
    const databaseService = injectedServices?.databaseService || defaultDatabaseService;
    const aiService = injectedServices?.aiService || await createAIService();

    // Get repository path and URL
    const repositoryPath = process.env.GIT_REPOSITORY_PATH || process.cwd();
    const repositoryUrl = `file://${repositoryPath}`;

    // Check AI configuration
    const configService = getAIConfigService();
    if (!configService.isAIEnabled()) {
      logger.warn('AI functionality is disabled, refreshing basic summaries only', {
        author
      });
    }

    logger.info('Starting AI summary refresh', {
      author,
      since: since.toISOString(),
      aiEnabled: configService.isAIEnabled()
    });

    // Clear existing AI summaries for the date range
    await databaseService.deleteAISummaries(author, since);
    
    logger.debug('Cleared existing AI summaries', {
      author,
      since: since.toISOString()
    });

    // Fetch fresh commits from Git
    const commits = await gitService.getCommits(author, since, repositoryPath);

    if (commits.length === 0) {
      logger.info('No commits found for refresh', {
        author,
        since: since.toISOString()
      });

      return {
        success: true,
        data: []
      };
    }

    // Generate fresh AI-enhanced summaries
    const summaries = await generateFreshAISummaries(
      commits,
      author,
      repositoryUrl,
      databaseService,
      aiService,
      configService.isAIEnabled()
    );

    logger.info('AI summary refresh completed', {
      author,
      summaryCount: summaries.length,
      aiEnhanced: summaries.filter(s => s.hasAISummary).length
    });

    return {
      success: true,
      data: summaries
    };

  } catch (error) {
    logger.error('refreshAISummaries error:', {
      author,
      since: since?.toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Database')) {
        return {
          success: false,
          error: 'Database operation failed during refresh',
          code: 'DATABASE_ERROR'
        };
      }

      if (error.message.includes('Git')) {
        return {
          success: false,
          error: 'Failed to fetch Git commits',
          code: 'GIT_ERROR'
        };
      }

      if (error.message.includes('AI service')) {
        return {
          success: false,
          error: 'AI service error during refresh',
          code: 'AI_SERVICE_ERROR'
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh AI summaries',
      code: 'REFRESH_ERROR'
    };
  }
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
    
    if (!config.apiKey) {
      logger.warn('No API key configured, using mock AI service for refresh');
      return new MockAIService();
    }

    return new OpenRouterAIService({
      apiKey: config.apiKey,
      timeout: config.timeout
    });
  } catch (error) {
    logger.warn('Failed to create AI service for refresh, using mock', {
      error: error instanceof Error ? error.message : String(error)
    });
    return new MockAIService();
  }
}

/**
 * Generate fresh AI-enhanced summaries (no cache checking)
 * @param commits - Array of Git commits
 * @param authorName - Author name for the summaries
 * @param repositoryUrl - Repository URL
 * @param databaseService - Database service instance
 * @param aiService - AI service instance
 * @param useAI - Whether to use AI enhancement
 * @returns Promise resolving to array of EnhancedDailySummary objects
 */
async function generateFreshAISummaries(
  commits: any[],
  authorName: string,
  repositoryUrl: string,
  databaseService: DatabaseService,
  aiService: AIService,
  useAI: boolean = true
): Promise<EnhancedDailySummary[]> {
  // Group commits by day
  const commitsByDay = new Map<string, any[]>();

  commits.forEach(commit => {
    const dayKey = commit.date.toDateString();
    if (!commitsByDay.has(dayKey)) {
      commitsByDay.set(dayKey, []);
    }
    commitsByDay.get(dayKey)!.push(commit);
  });

  // Generate summaries for each day
  const summaries: EnhancedDailySummary[] = [];
  const errors: string[] = [];

  for (const [dayKey, dayCommits] of commitsByDay.entries()) {
    const summaryDate = new Date(dayKey);
    
    // Generate basic summary text
    const thaiDate = formatThaiDate(summaryDate);
    const bulletPoints = dayCommits
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(commit => `- ${commit.message}`);
    const basicSummaryText = `${thaiDate}\n${bulletPoints.join('\n')}`;

    let aiSummaryId: number | undefined;
    let aiSummaryText: string | undefined;
    let aiModelUsed: string | undefined;

    // Generate fresh AI summary if enabled
    if (useAI) {
      try {
        const configService = getAIConfigService();
        const generationConfig = configService.getGenerationConfig();
        
        logger.info('Generating fresh AI summary', {
          author: authorName,
          date: summaryDate.toISOString(),
          commitCount: dayCommits.length
        });

        const startTime = Date.now();
        const aiSummary = await aiService.generateSummary(dayCommits, generationConfig);
        const duration = Date.now() - startTime;
        
        if (aiSummary && aiSummary.trim().length > 0) {
          // Save AI summary to database
          const savedAISummary = await databaseService.saveAISummary({
            authorName,
            summaryDate,
            commitHashList: dayCommits.map(c => c.hash),
            aiSummaryText: aiSummary,
            modelUsed: generationConfig.model
          });

          aiSummaryId = savedAISummary.id;
          aiSummaryText = aiSummary;
          aiModelUsed = generationConfig.model;

          // Record API usage
          await databaseService.recordAPIUsage({
            modelUsed: generationConfig.model,
            tokensUsed: Math.floor(aiSummary.length / 4),
            requestDuration: duration,
            requestStatus: 'success',
            authorName
          });

          logger.info('Fresh AI summary generated successfully', {
            author: authorName,
            date: summaryDate.toISOString(),
            model: generationConfig.model,
            duration,
            summaryLength: aiSummary.length
          });
        } else {
          logger.warn('AI service returned empty summary during refresh', {
            author: authorName,
            date: summaryDate.toISOString()
          });
          
          errors.push(`Empty AI response for ${thaiDate}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.warn('AI summary generation failed during refresh, using basic summary', {
          author: authorName,
          date: summaryDate.toISOString(),
          error: errorMessage
        });

        errors.push(`AI generation failed for ${thaiDate}: ${errorMessage}`);

        // Record API usage failure
        const configService = getAIConfigService();
        await databaseService.recordAPIUsage({
          modelUsed: configService.getGenerationConfig().model,
          tokensUsed: 0,
          requestDuration: 1000,
          requestStatus: 'error',
          errorMessage,
          authorName
        });
      }
    }

    // Save daily summary with optional AI enhancement
    const summary = await databaseService.saveDailySummary({
      authorName,
      summaryDate,
      summaryText: basicSummaryText,
      repositoryUrl
    }, aiSummaryId);

    summaries.push(summary);
  }

  // Log any errors that occurred during refresh
  if (errors.length > 0) {
    logger.warn('Some AI summaries failed during refresh', {
      author: authorName,
      errorCount: errors.length,
      errors: errors.slice(0, 3) // Log first 3 errors
    });
  }

  // Sort summaries by date
  return summaries.sort((a, b) => a.summaryDate.getTime() - b.summaryDate.getTime());
}
