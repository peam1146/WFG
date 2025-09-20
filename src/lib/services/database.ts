// Database service for DailySummary and AI operations using Prisma
// Handles all database interactions for daily summaries and AI enhancements

import { AISummary, AISummaryInput, EnhancedDailySummary } from "@/types/ai";
import {
  APIUsageInput,
  APIUsageStats,
  APIUsageTracking,
} from "@/types/api-usage";
import { DailySummary } from "@/types/git";
import {
  AISummary as PrismaAISummary,
  APIUsageTracking as PrismaAPIUsageTracking,
  PrismaClient,
  DailySummary as PrismaDailySummary,
} from "@prisma/client";

export class DatabaseService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Retrieve daily summaries by author and date range
   * @param authorName - Author name to filter by
   * @param since - Start date for summaries
   * @param repositoryUrl - Repository URL to filter by
   * @returns Promise resolving to array of DailySummary objects
   */
  async getSummaries(
    authorName: string,
    since: Date,
    repositoryUrl: string
  ): Promise<DailySummary[]> {
    const summaries = await this.prisma.dailySummary.findMany({
      where: {
        authorName,
        summaryDate: {
          gte: since,
        },
        repositoryUrl,
      },
      orderBy: {
        summaryDate: "asc",
      },
    });

    return summaries.map(this.transformPrismaToType);
  }

  /**
   * Create a new daily summary
   * @param summaryData - Summary data to create
   * @returns Promise resolving to created DailySummary
   */
  async createSummary(
    summaryData: Omit<DailySummary, "id" | "createdAt" | "updatedAt">
  ): Promise<DailySummary> {
    const created = await this.prisma.dailySummary.create({
      data: summaryData,
    });

    return this.transformPrismaToType(created);
  }

  /**
   * Update existing summary or create new one (upsert)
   * @param summaryData - Summary data to upsert
   * @returns Promise resolving to upserted DailySummary
   */
  async upsertSummary(
    summaryData: Omit<DailySummary, "id" | "createdAt" | "updatedAt">
  ): Promise<DailySummary> {
    const upserted = await this.prisma.dailySummary.upsert({
      where: {
        authorName_summaryDate_repositoryUrl: {
          authorName: summaryData.authorName,
          summaryDate: summaryData.summaryDate,
          repositoryUrl: summaryData.repositoryUrl,
        },
      },
      update: {
        summaryText: summaryData.summaryText,
        updatedAt: new Date(),
      },
      create: summaryData,
    });

    return this.transformPrismaToType(upserted);
  }

  /**
   * Delete summaries by author and date range
   * @param authorName - Author name to filter by
   * @param since - Start date for deletion
   * @param repositoryUrl - Repository URL to filter by
   */
  async deleteSummaries(
    authorName: string,
    since: Date,
    repositoryUrl: string
  ): Promise<void> {
    await this.prisma.dailySummary.deleteMany({
      where: {
        authorName,
        summaryDate: {
          gte: since,
        },
        repositoryUrl,
      },
    });
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // ========================================
  // AI Summary Operations
  // ========================================

  /**
   * Save an AI-generated summary
   * @param aiSummaryData - AI summary data to save
   * @returns Promise resolving to created AISummary
   */
  async saveAISummary(aiSummaryData: AISummaryInput): Promise<AISummary> {
    const created = await this.prisma.aISummary.upsert({
      where: {
        authorName_summaryDate: {
          authorName: aiSummaryData.authorName,
          summaryDate: aiSummaryData.summaryDate,
        },
      },
      update: {
        commitHashList: JSON.stringify(aiSummaryData.commitHashList),
        aiSummaryText: aiSummaryData.aiSummaryText,
        modelUsed: aiSummaryData.modelUsed,
      },
      create: {
        authorName: aiSummaryData.authorName,
        summaryDate: aiSummaryData.summaryDate,
        commitHashList: JSON.stringify(aiSummaryData.commitHashList),
        aiSummaryText: aiSummaryData.aiSummaryText,
        modelUsed: aiSummaryData.modelUsed,
      },
    });

    return this.transformPrismaAIToType(created);
  }

  /**
   * Get AI summary by author and date
   * @param authorName - Author name to filter by
   * @param summaryDate - Date to filter by
   * @returns Promise resolving to AISummary or null
   */
  async getAISummary(
    authorName: string,
    summaryDate: Date
  ): Promise<AISummary | null> {
    const aiSummary = await this.prisma.aISummary.findUnique({
      where: {
        authorName_summaryDate: {
          authorName,
          summaryDate,
        },
      },
    });

    return aiSummary ? this.transformPrismaAIToType(aiSummary) : null;
  }

  /**
   * Delete AI summaries by author and date range
   * @param authorName - Author name to filter by
   * @param since - Start date for deletion
   */
  async deleteAISummaries(authorName: string, since: Date): Promise<void> {
    await this.prisma.aISummary.deleteMany({
      where: {
        authorName,
        summaryDate: {
          gte: since,
        },
      },
    });
  }

  /**
   * Get enhanced daily summaries with AI data
   * @param authorName - Author name to filter by
   * @param since - Start date for summaries
   * @param repositoryUrl - Repository URL to filter by
   * @returns Promise resolving to array of EnhancedDailySummary objects
   */
  async getDailySummaries(
    authorName: string,
    since: Date,
    repositoryUrl: string
  ): Promise<EnhancedDailySummary[]> {
    const summaries = await this.prisma.dailySummary.findMany({
      where: {
        authorName,
        summaryDate: {
          gte: since,
        },
        repositoryUrl,
      },
      include: {
        aiSummary: true,
      },
      orderBy: {
        summaryDate: "asc",
      },
    });

    return summaries.map(this.transformPrismaToEnhancedType);
  }

  /**
   * Save a daily summary with optional AI enhancement
   * @param summaryData - Summary data to save
   * @param aiSummaryId - Optional AI summary ID to link
   * @returns Promise resolving to saved EnhancedDailySummary
   */
  async saveDailySummary(
    summaryData: Omit<DailySummary, "id" | "createdAt" | "updatedAt">,
    aiSummaryId?: number
  ): Promise<EnhancedDailySummary> {
    const saved = await this.prisma.dailySummary.upsert({
      where: {
        authorName_summaryDate_repositoryUrl: {
          authorName: summaryData.authorName,
          summaryDate: summaryData.summaryDate,
          repositoryUrl: summaryData.repositoryUrl,
        },
      },
      update: {
        summaryText: summaryData.summaryText,
        hasAISummary: !!aiSummaryId,
        aiSummaryId: aiSummaryId || null,
        updatedAt: new Date(),
      },
      create: {
        ...summaryData,
        hasAISummary: !!aiSummaryId,
        aiSummaryId: aiSummaryId || null,
      },
      include: {
        aiSummary: true,
      },
    });

    return this.transformPrismaToEnhancedType(saved);
  }

  // ========================================
  // API Usage Tracking Operations
  // ========================================

  /**
   * Record API usage statistics
   * @param usageData - API usage data to record
   * @returns Promise resolving to created APIUsageTracking
   */
  async recordAPIUsage(usageData: APIUsageInput): Promise<APIUsageTracking> {
    const created = await this.prisma.aPIUsageTracking.create({
      data: usageData,
    });

    return this.transformPrismaUsageToType(created);
  }

  /**
   * Get API usage statistics for a date range
   * @param since - Start date for statistics
   * @param until - End date for statistics (optional, defaults to now)
   * @returns Promise resolving to APIUsageStats
   */
  async getAPIUsageStats(since: Date, until?: Date): Promise<APIUsageStats> {
    const endDate = until || new Date();

    const usageRecords = await this.prisma.aPIUsageTracking.findMany({
      where: {
        requestTimestamp: {
          gte: since,
          lte: endDate,
        },
      },
    });

    if (usageRecords.length === 0) {
      return {
        requests: 0,
        tokens: 0,
        errors: 0,
        averageLatency: 0,
        successRate: 0,
      };
    }

    const totalRequests = usageRecords.length;
    const totalTokens = usageRecords.reduce(
      (sum, record) => sum + record.tokensUsed,
      0
    );
    const totalErrors = usageRecords.filter(
      (record) => record.requestStatus !== "success"
    ).length;
    const totalLatency = usageRecords.reduce(
      (sum, record) => sum + record.requestDuration,
      0
    );
    const averageLatency = totalLatency / totalRequests;
    const successRate = ((totalRequests - totalErrors) / totalRequests) * 100;

    return {
      requests: totalRequests,
      tokens: totalTokens,
      errors: totalErrors,
      averageLatency,
      successRate,
    };
  }

  /**
   * Get today's API usage statistics
   * @returns Promise resolving to today's APIUsageStats
   */
  async getTodayAPIUsageStats(): Promise<APIUsageStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.getAPIUsageStats(today);
  }

  /**
   * Transform Prisma DailySummary to our type interface
   * @param prismaData - Prisma DailySummary object
   * @returns DailySummary type object
   */
  private transformPrismaToType(prismaData: PrismaDailySummary): DailySummary {
    return {
      id: prismaData.id,
      authorName: prismaData.authorName,
      summaryDate: prismaData.summaryDate,
      summaryText: prismaData.summaryText,
      repositoryUrl: prismaData.repositoryUrl,
      createdAt: prismaData.createdAt,
      updatedAt: prismaData.updatedAt,
    };
  }

  /**
   * Transform Prisma AISummary to our type interface
   * @param prismaData - Prisma AISummary object
   * @returns AISummary type object
   */
  private transformPrismaAIToType(prismaData: PrismaAISummary): AISummary {
    return {
      id: prismaData.id,
      authorName: prismaData.authorName,
      summaryDate: prismaData.summaryDate,
      commitHashList: prismaData.commitHashList,
      aiSummaryText: prismaData.aiSummaryText,
      modelUsed: prismaData.modelUsed,
      createdAt: prismaData.createdAt,
      updatedAt: prismaData.updatedAt,
    };
  }

  /**
   * Transform Prisma DailySummary with AI relation to EnhancedDailySummary
   * @param prismaData - Prisma DailySummary with aiSummary relation
   * @returns EnhancedDailySummary type object
   */
  private transformPrismaToEnhancedType(
    prismaData: PrismaDailySummary & { aiSummary?: PrismaAISummary | null }
  ): EnhancedDailySummary {
    return {
      id: prismaData.id,
      authorName: prismaData.authorName,
      summaryDate: prismaData.summaryDate,
      summaryText: prismaData.summaryText,
      repositoryUrl: prismaData.repositoryUrl,
      createdAt: prismaData.createdAt,
      updatedAt: prismaData.updatedAt,
      hasAISummary: prismaData.hasAISummary,
      aiSummaryId: prismaData.aiSummaryId || undefined,
      aiSummaryText: prismaData.aiSummary?.aiSummaryText,
      aiModelUsed: prismaData.aiSummary?.modelUsed,
      generatedAt: prismaData.aiSummary?.createdAt,
    };
  }

  /**
   * Transform Prisma APIUsageTracking to our type interface
   * @param prismaData - Prisma APIUsageTracking object
   * @returns APIUsageTracking type object
   */
  private transformPrismaUsageToType(
    prismaData: PrismaAPIUsageTracking
  ): APIUsageTracking {
    return {
      id: prismaData.id,
      requestTimestamp: prismaData.requestTimestamp,
      modelUsed: prismaData.modelUsed,
      tokensUsed: prismaData.tokensUsed,
      requestDuration: prismaData.requestDuration,
      requestStatus:
        prismaData.requestStatus as APIUsageTracking["requestStatus"],
      errorMessage: prismaData.errorMessage || undefined,
      authorName: prismaData.authorName,
    };
  }
}
