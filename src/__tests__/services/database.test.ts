// Unit test: Database operations for DailySummary
// This test MUST FAIL until the database service is implemented

import { DatabaseService } from '@/lib/services/database';
import { DailySummary } from '@/types/git';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client');

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      dailySummary: {
        findMany: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    } as any;

    databaseService = new DatabaseService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummaries', () => {
    it('should retrieve summaries by author and date range', async () => {
      // Arrange
      const mockSummaries = [
        {
          id: 'test-id-1',
          authorName: 'Test Author',
          summaryDate: new Date('2025-09-20'),
          summaryText: '20 ก.ย. 2568\n- Test commit',
          repositoryUrl: 'file:///test/repo',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      mockPrisma.dailySummary.findMany.mockResolvedValue(mockSummaries);

      // Act
      const result = await databaseService.getSummaries('Test Author', new Date('2025-09-13'), 'file:///test/repo');

      // Assert
      expect(result).toEqual(mockSummaries);
      expect(mockPrisma.dailySummary.findMany).toHaveBeenCalledWith({
        where: {
          authorName: 'Test Author',
          summaryDate: {
            gte: new Date('2025-09-13')
          },
          repositoryUrl: 'file:///test/repo'
        },
        orderBy: {
          summaryDate: 'asc'
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockPrisma.dailySummary.findMany.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(
        databaseService.getSummaries('Test Author', new Date('2025-09-13'), 'file:///test/repo')
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('createSummary', () => {
    it('should create a new daily summary', async () => {
      // Arrange
      const summaryData = {
        authorName: 'Test Author',
        summaryDate: new Date('2025-09-20'),
        summaryText: '20 ก.ย. 2568\n- Test commit',
        repositoryUrl: 'file:///test/repo'
      };

      const mockCreatedSummary = {
        id: 'new-id',
        ...summaryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.dailySummary.create.mockResolvedValue(mockCreatedSummary);

      // Act
      const result = await databaseService.createSummary(summaryData);

      // Assert
      expect(result).toEqual(mockCreatedSummary);
      expect(mockPrisma.dailySummary.create).toHaveBeenCalledWith({
        data: summaryData
      });
    });

    it('should handle unique constraint violations', async () => {
      // Arrange
      const summaryData = {
        authorName: 'Test Author',
        summaryDate: new Date('2025-09-20'),
        summaryText: '20 ก.ย. 2568\n- Test commit',
        repositoryUrl: 'file:///test/repo'
      };

      mockPrisma.dailySummary.create.mockRejectedValue(
        new Error('Unique constraint failed')
      );

      // Act & Assert
      await expect(
        databaseService.createSummary(summaryData)
      ).rejects.toThrow('Unique constraint failed');
    });
  });

  describe('upsertSummary', () => {
    it('should update existing summary or create new one', async () => {
      // Arrange
      const summaryData = {
        authorName: 'Test Author',
        summaryDate: new Date('2025-09-20'),
        summaryText: '20 ก.ย. 2568\n- Updated commit',
        repositoryUrl: 'file:///test/repo'
      };

      const mockUpsertedSummary = {
        id: 'upserted-id',
        ...summaryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.dailySummary.upsert.mockResolvedValue(mockUpsertedSummary);

      // Act
      const result = await databaseService.upsertSummary(summaryData);

      // Assert
      expect(result).toEqual(mockUpsertedSummary);
      expect(mockPrisma.dailySummary.upsert).toHaveBeenCalledWith({
        where: {
          authorName_summaryDate_repositoryUrl: {
            authorName: summaryData.authorName,
            summaryDate: summaryData.summaryDate,
            repositoryUrl: summaryData.repositoryUrl
          }
        },
        update: {
          summaryText: summaryData.summaryText,
          updatedAt: expect.any(Date)
        },
        create: summaryData
      });
    });
  });

  describe('deleteSummaries', () => {
    it('should delete summaries by author and date range', async () => {
      // Arrange
      mockPrisma.dailySummary.delete.mockResolvedValue({} as any);

      // Act
      await databaseService.deleteSummaries('Test Author', new Date('2025-09-13'), 'file:///test/repo');

      // Assert
      expect(mockPrisma.dailySummary.delete).toHaveBeenCalled();
    });
  });

  describe('connection management', () => {
    it('should connect to database', async () => {
      // Act
      await databaseService.connect();

      // Assert
      expect(mockPrisma.$connect).toHaveBeenCalled();
    });

    it('should disconnect from database', async () => {
      // Act
      await databaseService.disconnect();

      // Assert
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });
});
