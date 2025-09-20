// AI-Enhanced Server Actions
// Dedicated Server Actions for AI-powered worklog summarization

'use server';

import { getAIConfigService } from '@/lib/services/ai-config';
import { AIService } from '@/lib/services/ai/ai-service';
import { MockAIService } from '@/lib/services/ai/mock-ai';
import { OpenRouterAIService } from '@/lib/services/ai/openrouter-ai';
import { DatabaseService } from '@/lib/services/database';
import { RealGitService } from '@/lib/services/git/real-git';
import { formatThaiDate } from '@/lib/utils/date-formatter';
import { logger } from '@/lib/utils/logger';
import { SummaryGenerationFormSchema } from '@/lib/validations/git';
import { ActionResult } from '@/types/actions';
import { EnhancedDailySummary } from '@/types/ai';
import { GitService } from '@/types/git';
import { ZodError } from 'zod';

// Default services (can be injected for testing)
const defaultGitService: GitService = new RealGitService();
const defaultDatabaseService = new DatabaseService();

/**
 * Server Action to generate AI-enhanced worklog summaries
 * @param formData - Form data containing author, since date, and optional parameters
 * @param injectedServices - Optional services for testing
 * @returns ActionResult with EnhancedDailySummary array or error
 */
export async function generateAISummaries(
  formData: FormData,
  injectedServices?: {
    gitService?: GitService;
    aiService?: AIService;
    databaseService?: DatabaseService;
  }
): Promise<ActionResult<EnhancedDailySummary[]>> {
  try {
    // Extract and validate form data
    const rawData = {
      author: formData.get('author') as string,
      since: formData.get('since') as string,
      refresh: formData.get('refresh') as string,
      useAI: formData.get('useAI') as string,
    };

    // Validate using Zod schema
    const validatedData = SummaryGenerationFormSchema.parse(rawData);

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
      return {
        success: false,
        error: 'AI functionality is disabled',
        code: 'AI_DISABLED'
      };
    }

    // Check if we should use cached summaries (unless refresh is requested)
    if (!validatedData.refresh) {
      const existingSummaries = await databaseService.getDailySummaries(
        validatedData.author,
        validatedData.since,
        repositoryUrl
      );

      // Filter for summaries that have AI enhancement
      const aiSummaries = existingSummaries.filter(summary => summary.hasAISummary);
      
      if (aiSummaries.length > 0) {
        logger.info('Returning cached AI summaries', {
          author: validatedData.author,
          count: aiSummaries.length
        });

        return {
          success: true,
          data: aiSummaries
        };
      }
    }

    // Fetch fresh commits from Git
    const commits = await gitService.getCommits(
      validatedData.author,
      validatedData.since,
      repositoryPath
    );

    if (commits.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // Generate AI-enhanced summaries
    const summaries = await generateAIEnhancedSummaries(
      commits,
      validatedData.author,
      repositoryUrl,
      databaseService,
      aiService,
      validatedData.refresh
    );

    logger.info('AI summaries generated successfully', {
      author: validatedData.author,
      summaryCount: summaries.length,
      aiEnhanced: summaries.filter(s => s.hasAISummary).length
    });

    return {
      success: true,
      data: summaries
    };

  } catch (error) {
    logger.error('generateAISummaries error:', {
      error: error instanceof Error ? error.message : String(error)
    });

    // Handle validation errors
    if (error instanceof ZodError) {
      const errorMessage = error.issues?.[0]?.message || 'Validation failed';
      return {
        success: false,
        error: errorMessage,
        code: 'VALIDATION_ERROR'
      };
    }

    // Handle AI-specific errors
    if (error instanceof Error) {
      if (error.message.includes('AI service unavailable')) {
        return {
          success: false,
          error: 'AI service is currently unavailable',
          code: 'AI_SERVICE_UNAVAILABLE'
        };
      }

      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'AI service rate limit exceeded. Please try again later.',
          code: 'AI_RATE_LIMITED'
        };
      }

      if (error.message.includes('Database')) {
        return {
          success: false,
          error: 'Database operation failed',
          code: 'DATABASE_ERROR'
        };
      }
    }

    // Generic error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate AI summaries',
      code: 'AI_GENERATION_ERROR'
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
      logger.warn('No API key configured, using mock AI service');
      return new MockAIService();
    }

    return new OpenRouterAIService({
      apiKey: config.apiKey,
      timeout: config.timeout
    });
  } catch (error) {
    logger.warn('Failed to create AI service, using mock', {
      error: error instanceof Error ? error.message : String(error)
    });
    return new MockAIService();
  }
}

/**
 * Generate AI-enhanced summaries from commits
 * @param commits - Array of Git commits
 * @param authorName - Author name for the summaries
 * @param repositoryUrl - Repository URL
 * @param databaseService - Database service instance
 * @param aiService - AI service instance
 * @param forceRefresh - Whether to force refresh existing summaries
 * @returns Promise resolving to array of EnhancedDailySummary objects
 */
async function generateAIEnhancedSummaries(
  commits: any[],
  authorName: string,
  repositoryUrl: string,
  databaseService: DatabaseService,
  aiService: AIService,
  forceRefresh: boolean = false
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

  for (const [dayKey, dayCommits] of commitsByDay.entries()) {
    const summaryDate = new Date(dayKey);
    
    // Check for existing AI summary unless forcing refresh
    let existingAISummary = null;
    if (!forceRefresh) {
      existingAISummary = await databaseService.getAISummary(authorName, summaryDate);
      
      // Verify commit hashes match (cache invalidation)
      if (existingAISummary) {
        const existingHashes = JSON.parse(existingAISummary.commitHashList);
        const currentHashes = dayCommits.map(c => c.hash).sort();
        const hashesMatch = existingHashes.length === currentHashes.length &&
          existingHashes.sort().every((hash: string, index: number) => hash === currentHashes[index]);
        
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
      .map(commit => `- ${commit.message}`);
    const basicSummaryText = `${thaiDate}\n${bulletPoints.join('\n')}`;

    let aiSummaryId: number | undefined;
    let aiSummaryText: string | undefined;
    let aiModelUsed: string | undefined;

    // Generate or use existing AI summary
    if (!existingAISummary) {
      try {
        const configService = getAIConfigService();
        const generationConfig = configService.getGenerationConfig();
        
        logger.info('Generating AI summary', {
          author: authorName,
          date: summaryDate.toISOString(),
          commitCount: dayCommits.length
        });

        const startTime = Date.now();
        console.log('Generating AI summary', {
          author: authorName,
          date: summaryDate.toISOString(),
          commitCount: dayCommits.length
        });
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

          logger.info('AI summary generated successfully', {
            author: authorName,
            date: summaryDate.toISOString(),
            model: generationConfig.model,
            duration,
            summaryLength: aiSummary.length
          });
        } else {
          logger.warn('AI service returned empty summary', {
            author: authorName,
            date: summaryDate.toISOString()
          });
        }
      } catch (error) {
        logger.error('AI summary generation failed', {
          author: authorName,
          date: summaryDate.toISOString(),
          error: error instanceof Error ? error.message : String(error)
        });

        // Record API usage failure
        const configService = getAIConfigService();
        await databaseService.recordAPIUsage({
          modelUsed: configService.getGenerationConfig().model,
          tokensUsed: 0,
          requestDuration: 1000,
          requestStatus: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
          authorName
        });

        // Re-throw error to be handled by caller
        throw error;
      }
    } else {
      // Use existing AI summary
      aiSummaryId = existingAISummary.id;
      aiSummaryText = existingAISummary.aiSummaryText;
      aiModelUsed = existingAISummary.modelUsed;

      logger.debug('Using cached AI summary', {
        author: authorName,
        date: summaryDate.toISOString(),
        aiSummaryId
      });
    }

    // Save daily summary with AI enhancement
    const summary = await databaseService.saveDailySummary({
      authorName,
      summaryDate,
      summaryText: basicSummaryText,
      repositoryUrl
    }, aiSummaryId);

    summaries.push(summary);
  }

  // Sort summaries by date
  return summaries.sort((a, b) => a.summaryDate.getTime() - b.summaryDate.getTime());
}
