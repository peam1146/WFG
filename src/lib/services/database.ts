// Database service for DailySummary operations using Prisma
// Handles all database interactions for daily summaries

import { PrismaClient, DailySummary as PrismaDailySummary } from '@prisma/client';
import { DailySummary } from '@/types/git';

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
          gte: since
        },
        repositoryUrl
      },
      orderBy: {
        summaryDate: 'asc'
      }
    });

    return summaries.map(this.transformPrismaToType);
  }

  /**
   * Create a new daily summary
   * @param summaryData - Summary data to create
   * @returns Promise resolving to created DailySummary
   */
  async createSummary(summaryData: Omit<DailySummary, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailySummary> {
    const created = await this.prisma.dailySummary.create({
      data: summaryData
    });

    return this.transformPrismaToType(created);
  }

  /**
   * Update existing summary or create new one (upsert)
   * @param summaryData - Summary data to upsert
   * @returns Promise resolving to upserted DailySummary
   */
  async upsertSummary(summaryData: Omit<DailySummary, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailySummary> {
    const upserted = await this.prisma.dailySummary.upsert({
      where: {
        authorName_summaryDate_repositoryUrl: {
          authorName: summaryData.authorName,
          summaryDate: summaryData.summaryDate,
          repositoryUrl: summaryData.repositoryUrl
        }
      },
      update: {
        summaryText: summaryData.summaryText,
        updatedAt: new Date()
      },
      create: summaryData
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
          gte: since
        },
        repositoryUrl
      }
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
      updatedAt: prismaData.updatedAt
    };
  }
}
