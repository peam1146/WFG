// Performance tests for AI summary generation
// Ensures AI operations complete within acceptable time limits

import { generateAISummaries } from '@/lib/actions/ai-actions';
import { MockAIService } from '@/lib/services/ai/mock-ai';
import { MockGitService } from '@/lib/services/git/mock-git';
import { DatabaseService } from '@/lib/services/database';
import { GitCommit } from '@/types/git';

// Mock services for controlled performance testing
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('AI Performance Tests', () => {
  let mockGitService: MockGitService;
  let mockAIService: MockAIService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockGitService = new MockGitService();
    mockAIService = new MockAIService();
    
    // Create mock database service
    mockDatabaseService = {
      getDailySummaries: jest.fn().mockResolvedValue([]),
      saveAISummary: jest.fn().mockResolvedValue({
        id: 1,
        authorName: 'Test User',
        summaryDate: new Date(),
        commitHashList: '[]',
        aiSummaryText: 'Mock AI summary',
        modelUsed: 'mock-model',
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      saveDailySummary: jest.fn().mockResolvedValue({
        id: 1,
        authorName: 'Test User',
        summaryDate: new Date(),
        summaryText: 'Mock summary',
        repositoryUrl: 'file:///test',
        createdAt: new Date(),
        updatedAt: new Date(),
        hasAISummary: true,
        aiSummaryId: 1,
        aiSummaryText: 'Mock AI summary',
        aiModelUsed: 'mock-model',
        generatedAt: new Date()
      }),
      recordAPIUsage: jest.fn().mockResolvedValue({
        id: 1,
        requestTimestamp: new Date(),
        modelUsed: 'mock-model',
        tokensUsed: 100,
        requestDuration: 1000,
        requestStatus: 'success',
        authorName: 'Test User'
      }),
      getAISummary: jest.fn().mockResolvedValue(null)
    } as any;

    // Configure mock AI service for fast responses
    mockAIService.setMockResponse('Mock AI-generated summary for performance testing');
    mockAIService.setMockLatency(500); // 500ms response time
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockCommits = (count: number): GitCommit[] => {
    return Array.from({ length: count }, (_, i) => ({
      hash: `commit${i.toString().padStart(3, '0')}`,
      author: 'Performance Test User',
      email: 'test@example.com',
      date: new Date(`2025-09-20T${(8 + (i % 12)).toString().padStart(2, '0')}:${(i * 5 % 60).toString().padStart(2, '0')}:00Z`),
      message: `feat: Performance test commit ${i + 1}`,
      isMerge: false
    }));
  };

  describe('AI Summary Generation Performance', () => {
    it('should generate AI summaries for 5 commits under 3 seconds', async () => {
      const commits = createMockCommits(5);
      mockGitService.setMockCommits(commits);

      const formData = new FormData();
      formData.append('author', 'Performance Test User');
      formData.append('since', '2025-09-20');
      formData.append('useAI', 'true');

      const startTime = Date.now();
      
      const result = await generateAISummaries(formData, {
        gitService: mockGitService,
        aiService: mockAIService,
        databaseService: mockDatabaseService
      });

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(3000); // Under 3 seconds
      expect(mockAIService.generateSummary).toHaveBeenCalledTimes(1);
    });

    it('should generate AI summaries for 10 commits under 5 seconds', async () => {
      const commits = createMockCommits(10);
      mockGitService.setMockCommits(commits);

      const formData = new FormData();
      formData.append('author', 'Performance Test User');
      formData.append('since', '2025-09-20');
      formData.append('useAI', 'true');

      const startTime = Date.now();
      
      const result = await generateAISummaries(formData, {
        gitService: mockGitService,
        aiService: mockAIService,
        databaseService: mockDatabaseService
      });

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Under 5 seconds
    });

    it('should handle 25 commits (multi-day) under 10 seconds', async () => {
      const commits = createMockCommits(25);
      mockGitService.setMockCommits(commits);

      const formData = new FormData();
      formData.append('author', 'Performance Test User');
      formData.append('since', '2025-09-18'); // 3 days of commits
      formData.append('useAI', 'true');

      const startTime = Date.now();
      
      const result = await generateAISummaries(formData, {
        gitService: mockGitService,
        aiService: mockAIService,
        databaseService: mockDatabaseService
      });

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Under 10 seconds
    });

    it('should maintain performance with cached summaries', async () => {
      const commits = createMockCommits(10);
      mockGitService.setMockCommits(commits);

      // Mock existing summaries in cache
      mockDatabaseService.getDailySummaries.mockResolvedValue([{
        id: 1,
        authorName: 'Performance Test User',
        summaryDate: new Date('2025-09-20'),
        summaryText: 'Cached summary',
        repositoryUrl: 'file:///test',
        createdAt: new Date(),
        updatedAt: new Date(),
        hasAISummary: true,
        aiSummaryId: 1,
        aiSummaryText: 'Cached AI summary',
        aiModelUsed: 'cached-model',
        generatedAt: new Date()
      }]);

      const formData = new FormData();
      formData.append('author', 'Performance Test User');
      formData.append('since', '2025-09-20');
      formData.append('useAI', 'true');

      const startTime = Date.now();
      
      const result = await generateAISummaries(formData, {
        gitService: mockGitService,
        aiService: mockAIService,
        databaseService: mockDatabaseService
      });

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500); // Very fast with cache
      expect(mockAIService.generateSummary).not.toHaveBeenCalled();
    });
  });

  describe('AI Service Performance', () => {
    it('should respond to availability check under 1 second', async () => {
      const startTime = Date.now();
      
      const isAvailable = await mockAIService.isAvailable();
      
      const duration = Date.now() - startTime;

      expect(isAvailable).toBe(true);
      expect(duration).toBeLessThan(1000);
    });

    it('should handle connection test under 2 seconds', async () => {
      const startTime = Date.now();
      
      const connectionResult = await mockAIService.testConnection();
      
      const duration = Date.now() - startTime;

      expect(connectionResult).toBe(true);
      expect(duration).toBeLessThan(2000);
    });

    it('should maintain consistent response times across multiple calls', async () => {
      const commits = createMockCommits(3);
      const durations: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        await mockAIService.generateSummary(commits, {
          model: 'test-model',
          maxTokens: 1000,
          temperature: 0.3,
          timeout: 30000
        });
        
        durations.push(Date.now() - startTime);
      }

      // Check that all calls completed reasonably quickly
      durations.forEach(duration => {
        expect(duration).toBeLessThan(1000);
      });

      // Check consistency (no call should be more than 2x the average)
      const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      durations.forEach(duration => {
        expect(duration).toBeLessThan(average * 2);
      });
    });
  });

  describe('Database Performance', () => {
    it('should save AI summary under 500ms', async () => {
      const startTime = Date.now();
      
      await mockDatabaseService.saveAISummary({
        authorName: 'Test User',
        summaryDate: new Date(),
        commitHashList: ['commit1', 'commit2'],
        aiSummaryText: 'Performance test summary',
        modelUsed: 'test-model'
      });
      
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should retrieve daily summaries under 300ms', async () => {
      const startTime = Date.now();
      
      await mockDatabaseService.getDailySummaries(
        'Test User',
        new Date('2025-09-20'),
        'file:///test'
      );
      
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300);
    });

    it('should record API usage under 200ms', async () => {
      const startTime = Date.now();
      
      await mockDatabaseService.recordAPIUsage({
        modelUsed: 'test-model',
        tokensUsed: 100,
        requestDuration: 1000,
        requestStatus: 'success',
        authorName: 'Test User'
      });
      
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid successive requests without degradation', async () => {
      const commits = createMockCommits(5);
      mockGitService.setMockCommits(commits);

      const formData = new FormData();
      formData.append('author', 'Stress Test User');
      formData.append('since', '2025-09-20');
      formData.append('useAI', 'true');

      const promises = Array.from({ length: 5 }, async () => {
        const startTime = Date.now();
        
        const result = await generateAISummaries(formData, {
          gitService: mockGitService,
          aiService: mockAIService,
          databaseService: mockDatabaseService
        });
        
        return {
          success: result.success,
          duration: Date.now() - startTime
        };
      });

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.duration).toBeLessThan(5000);
      });
    });

    it('should maintain performance with large commit messages', async () => {
      const largeCommits = Array.from({ length: 5 }, (_, i) => ({
        hash: `large${i}`,
        author: 'Large Message User',
        email: 'large@example.com',
        date: new Date(`2025-09-20T1${i}:00:00Z`),
        message: `feat: Large commit message ${'A'.repeat(500)} - commit ${i + 1}`,
        isMerge: false
      }));

      mockGitService.setMockCommits(largeCommits);

      const formData = new FormData();
      formData.append('author', 'Large Message User');
      formData.append('since', '2025-09-20');
      formData.append('useAI', 'true');

      const startTime = Date.now();
      
      const result = await generateAISummaries(formData, {
        gitService: mockGitService,
        aiService: mockAIService,
        databaseService: mockDatabaseService
      });

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(4000); // Slightly longer for large messages
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with repeated operations', async () => {
      const commits = createMockCommits(10);
      mockGitService.setMockCommits(commits);

      const formData = new FormData();
      formData.append('author', 'Memory Test User');
      formData.append('since', '2025-09-20');
      formData.append('useAI', 'true');

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await generateAISummaries(formData, {
          gitService: mockGitService,
          aiService: mockAIService,
          databaseService: mockDatabaseService
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance targets for different commit counts', async () => {
      const testCases = [
        { commits: 1, maxTime: 1500 },
        { commits: 5, maxTime: 3000 },
        { commits: 10, maxTime: 5000 },
        { commits: 20, maxTime: 8000 }
      ];

      for (const testCase of testCases) {
        const commits = createMockCommits(testCase.commits);
        mockGitService.setMockCommits(commits);

        const formData = new FormData();
        formData.append('author', `Benchmark User ${testCase.commits}`);
        formData.append('since', '2025-09-20');
        formData.append('useAI', 'true');

        const startTime = Date.now();
        
        const result = await generateAISummaries(formData, {
          gitService: mockGitService,
          aiService: mockAIService,
          databaseService: mockDatabaseService
        });

        const duration = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(testCase.maxTime);
      }
    });
  });
});
