// Integration tests for AI cache invalidation on refresh
// These tests MUST FAIL initially (TDD approach)

import { generateAISummaries } from '@/lib/actions/ai-actions';
import { refreshAISummaries } from '@/lib/actions/ai-refresh-actions';
import { MockGitService } from '@/lib/services/git/mock-git';
import { DatabaseService } from '@/lib/services/database';

describe('AI Cache Invalidation on Refresh Integration', () => {
  let mockGitService: MockGitService;
  let databaseService: DatabaseService;

  beforeEach(() => {
    mockGitService = new MockGitService();
    databaseService = new DatabaseService();
    
    // Setup initial commits
    mockGitService.setMockCommits([
      {
        hash: 'initial-1',
        author: 'Cache Test User',
        email: 'cache@example.com',
        date: new Date('2025-09-20T10:00:00Z'),
        message: 'Initial commit',
        isMerge: false
      },
      {
        hash: 'initial-2',
        author: 'Cache Test User',
        email: 'cache@example.com',
        date: new Date('2025-09-20T14:00:00Z'),
        message: 'Second commit',
        isMerge: false
      }
    ]);
  });

  it('should cache AI summaries on first generation', async () => {
    const formData = new FormData();
    formData.append('author', 'Cache Test User');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('Initial AI summary'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 100, errors: 0 })
    };

    const mockDatabaseService = {
      getAISummary: jest.fn().mockResolvedValue(null), // No cache initially
      saveAISummary: jest.fn().mockResolvedValue(undefined),
      saveDailySummary: jest.fn().mockResolvedValue(undefined),
      getDailySummaries: jest.fn().mockResolvedValue([]),
      deleteAISummaries: jest.fn().mockResolvedValue(undefined)
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result.success).toBe(true);
    expect(mockAIService.generateSummary).toHaveBeenCalledTimes(1);
    expect(mockDatabaseService.saveAISummary).toHaveBeenCalled();
    
    // Verify cache was saved
    const saveCall = mockDatabaseService.saveAISummary.mock.calls[0][0];
    expect(saveCall.aiSummaryText).toBe('Initial AI summary');
    expect(saveCall.authorName).toBe('Cache Test User');
  });

  it('should use cached summaries on subsequent requests', async () => {
    const formData = new FormData();
    formData.append('author', 'Cache Test User');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const cachedSummary = {
      id: 1,
      authorName: 'Cache Test User',
      summaryDate: new Date('2025-09-20'),
      commitHashList: JSON.stringify(['initial-1', 'initial-2']),
      aiSummaryText: 'Cached AI summary',
      modelUsed: 'openai/gpt-4o-mini',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockDatabaseService = {
      getAISummary: jest.fn().mockResolvedValue(cachedSummary),
      getDailySummaries: jest.fn().mockResolvedValue([
        {
          authorName: 'Cache Test User',
          summaryDate: new Date('2025-09-20'),
          summaryText: 'Basic summary',
          repositoryUrl: 'test-repo',
          hasAISummary: true,
          aiSummaryId: 1
        }
      ]),
      saveAISummary: jest.fn(),
      saveDailySummary: jest.fn(),
      deleteAISummaries: jest.fn()
    };

    const mockAIService = {
      generateSummary: jest.fn(), // Should not be called
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 0, tokens: 0, errors: 0 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result.success).toBe(true);
    expect(mockAIService.generateSummary).not.toHaveBeenCalled(); // Used cache
    expect(mockDatabaseService.getAISummary).toHaveBeenCalled();

    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.hasAISummary).toBe(true);
      expect(summary.aiSummaryText).toBe('Cached AI summary');
    }
  });

  it('should clear cache and regenerate on refresh', async () => {
    const author = 'Refresh Test User';
    const since = new Date('2025-09-20');

    // Add new commits to simulate changes
    mockGitService.setMockCommits([
      {
        hash: 'initial-1',
        author: author,
        email: 'refresh@example.com',
        date: new Date('2025-09-20T10:00:00Z'),
        message: 'Initial commit',
        isMerge: false
      },
      {
        hash: 'new-commit',
        author: author,
        email: 'refresh@example.com',
        date: new Date('2025-09-20T16:00:00Z'),
        message: 'New commit after refresh',
        isMerge: false
      }
    ]);

    const mockDatabaseService = {
      deleteAISummaries: jest.fn().mockResolvedValue(undefined),
      getAISummary: jest.fn().mockResolvedValue(null), // No cache after deletion
      saveAISummary: jest.fn().mockResolvedValue(undefined),
      saveDailySummary: jest.fn().mockResolvedValue(undefined),
      getDailySummaries: jest.fn().mockResolvedValue([])
    };

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('Refreshed AI summary with new commits'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 120, errors: 0 })
    };

    const result = await refreshAISummaries(author, since, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result.success).toBe(true);
    expect(mockDatabaseService.deleteAISummaries).toHaveBeenCalledWith(author, since);
    expect(mockAIService.generateSummary).toHaveBeenCalled();
    expect(mockDatabaseService.saveAISummary).toHaveBeenCalled();

    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.hasAISummary).toBe(true);
      expect(summary.aiSummaryText).toBe('Refreshed AI summary with new commits');
    }
  });

  it('should detect commit changes and invalidate cache accordingly', async () => {
    const formData = new FormData();
    formData.append('author', 'Change Detection Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    // Cached summary with old commit hashes
    const cachedSummary = {
      id: 1,
      authorName: 'Change Detection Test',
      summaryDate: new Date('2025-09-20'),
      commitHashList: JSON.stringify(['old-commit-1', 'old-commit-2']),
      aiSummaryText: 'Old cached summary',
      modelUsed: 'openai/gpt-4o-mini',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Current commits are different from cached ones
    mockGitService.setMockCommits([
      {
        hash: 'new-commit-1',
        author: 'Change Detection Test',
        email: 'change@example.com',
        date: new Date('2025-09-20T10:00:00Z'),
        message: 'New commit 1',
        isMerge: false
      },
      {
        hash: 'new-commit-2',
        author: 'Change Detection Test',
        email: 'change@example.com',
        date: new Date('2025-09-20T14:00:00Z'),
        message: 'New commit 2',
        isMerge: false
      }
    ]);

    const mockDatabaseService = {
      getAISummary: jest.fn().mockResolvedValue(cachedSummary),
      saveAISummary: jest.fn().mockResolvedValue(undefined),
      saveDailySummary: jest.fn().mockResolvedValue(undefined),
      getDailySummaries: jest.fn().mockResolvedValue([]),
      deleteAISummaries: jest.fn().mockResolvedValue(undefined)
    };

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('New AI summary with updated commits'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 110, errors: 0 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result.success).toBe(true);
    // Should regenerate because commit hashes don't match
    expect(mockAIService.generateSummary).toHaveBeenCalled();
    expect(mockDatabaseService.saveAISummary).toHaveBeenCalled();

    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.aiSummaryText).toBe('New AI summary with updated commits');
    }
  });

  it('should handle cache corruption gracefully', async () => {
    const formData = new FormData();
    formData.append('author', 'Corruption Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    // Corrupted cache entry
    const corruptedCache = {
      id: 1,
      authorName: 'Corruption Test',
      summaryDate: new Date('2025-09-20'),
      commitHashList: 'invalid-json-string', // Corrupted JSON
      aiSummaryText: 'Corrupted summary',
      modelUsed: 'openai/gpt-4o-mini',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockDatabaseService = {
      getAISummary: jest.fn().mockResolvedValue(corruptedCache),
      saveAISummary: jest.fn().mockResolvedValue(undefined),
      saveDailySummary: jest.fn().mockResolvedValue(undefined),
      getDailySummaries: jest.fn().mockResolvedValue([]),
      deleteAISummaries: jest.fn().mockResolvedValue(undefined)
    };

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('Fresh AI summary after corruption'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 100, errors: 0 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result.success).toBe(true);
    // Should regenerate due to corrupted cache
    expect(mockAIService.generateSummary).toHaveBeenCalled();
    
    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.aiSummaryText).toBe('Fresh AI summary after corruption');
    }
  });

  it('should maintain cache isolation between different authors', async () => {
    const author1 = 'Author One';
    const author2 = 'Author Two';
    const since = new Date('2025-09-20');

    // Setup different commits for each author
    const author1Commits = [
      {
        hash: 'author1-commit',
        author: author1,
        email: 'author1@example.com',
        date: since,
        message: 'Author 1 commit',
        isMerge: false
      }
    ];

    const author2Commits = [
      {
        hash: 'author2-commit',
        author: author2,
        email: 'author2@example.com',
        date: since,
        message: 'Author 2 commit',
        isMerge: false
      }
    ];

    const mockDatabaseService = {
      getAISummary: jest.fn().mockImplementation((author: string) => {
        if (author === author1) {
          return Promise.resolve({
            id: 1,
            authorName: author1,
            summaryDate: since,
            commitHashList: JSON.stringify(['author1-commit']),
            aiSummaryText: 'Author 1 cached summary',
            modelUsed: 'openai/gpt-4o-mini'
          });
        }
        return Promise.resolve(null); // No cache for author2
      }),
      saveAISummary: jest.fn(),
      saveDailySummary: jest.fn(),
      getDailySummaries: jest.fn().mockResolvedValue([]),
      deleteAISummaries: jest.fn()
    };

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('Author 2 fresh summary'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 100, errors: 0 })
    };

    // Test author1 (should use cache)
    mockGitService.setMockCommits(author1Commits);
    const formData1 = new FormData();
    formData1.append('author', author1);
    formData1.append('since', '2025-09-20');
    formData1.append('useAI', 'true');

    const result1 = await generateAISummaries(formData1, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    // Test author2 (should generate fresh)
    mockGitService.setMockCommits(author2Commits);
    const formData2 = new FormData();
    formData2.append('author', author2);
    formData2.append('since', '2025-09-20');
    formData2.append('useAI', 'true');

    const result2 = await generateAISummaries(formData2, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // Author1 should use cache (no AI call)
    expect(mockAIService.generateSummary).toHaveBeenCalledTimes(1); // Only for author2

    if (result1.data && result1.data.length > 0) {
      expect(result1.data[0].aiSummaryText).toBe('Author 1 cached summary');
    }

    if (result2.data && result2.data.length > 0) {
      expect(result2.data[0].aiSummaryText).toBe('Author 2 fresh summary');
    }
  });

  it('should handle concurrent refresh operations safely', async () => {
    const author = 'Concurrent Test';
    const since = new Date('2025-09-20');

    const mockDatabaseService = {
      deleteAISummaries: jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      ),
      getAISummary: jest.fn().mockResolvedValue(null),
      saveAISummary: jest.fn().mockResolvedValue(undefined),
      saveDailySummary: jest.fn().mockResolvedValue(undefined),
      getDailySummaries: jest.fn().mockResolvedValue([])
    };

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('Concurrent refresh summary'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 2, tokens: 200, errors: 0 })
    };

    // Start two concurrent refresh operations
    const refresh1Promise = refreshAISummaries(author, since, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    const refresh2Promise = refreshAISummaries(author, since, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    const [result1, result2] = await Promise.all([refresh1Promise, refresh2Promise]);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(mockDatabaseService.deleteAISummaries).toHaveBeenCalledTimes(2);
  });

  it('should preserve cache timestamps for debugging', async () => {
    const formData = new FormData();
    formData.append('author', 'Timestamp Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const beforeGeneration = Date.now();

    const mockDatabaseService = {
      getAISummary: jest.fn().mockResolvedValue(null),
      saveAISummary: jest.fn().mockImplementation((summary) => {
        expect(summary.createdAt).toBeDefined();
        expect(summary.updatedAt).toBeDefined();
        expect(new Date(summary.createdAt).getTime()).toBeGreaterThanOrEqual(beforeGeneration);
        return Promise.resolve();
      }),
      saveDailySummary: jest.fn(),
      getDailySummaries: jest.fn().mockResolvedValue([]),
      deleteAISummaries: jest.fn()
    };

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('Timestamped summary'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 100, errors: 0 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result.success).toBe(true);
    expect(mockDatabaseService.saveAISummary).toHaveBeenCalled();
  });
});
