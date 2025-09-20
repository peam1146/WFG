// Integration tests for AI summary generation workflow
// These tests MUST FAIL initially (TDD approach)

import { generateAISummaries } from '@/lib/actions/ai-actions';
import { MockGitService } from '@/lib/services/git/mock-git';
import { DatabaseService } from '@/lib/services/database';

describe('AI Summary Generation Workflow Integration', () => {
  let mockGitService: MockGitService;
  let databaseService: DatabaseService;

  beforeEach(() => {
    mockGitService = new MockGitService();
    databaseService = new DatabaseService();
    
    // Setup mock commits for testing
    mockGitService.setMockCommits([
      {
        hash: 'abc123',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-20T10:00:00Z'),
        message: 'feat: Add user authentication system',
        isMerge: false
      },
      {
        hash: 'def456',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-20T14:30:00Z'),
        message: 'fix: Resolve login validation issues',
        isMerge: false
      },
      {
        hash: 'ghi789',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-20T16:45:00Z'),
        message: 'refactor: Update user service for better performance',
        isMerge: false
      }
    ]);
  });

  it('should generate AI-enhanced summaries from Git commits', async () => {
    const formData = new FormData();
    formData.append('author', 'John Doe');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue(
        '20 ก.ย. 2568\n' +
        '- Implemented comprehensive user authentication system with secure login validation\n' +
        '- Resolved critical login validation issues affecting user access\n' +
        '- Refactored user service architecture for improved performance and maintainability'
      ),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 150, errors: 0 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);

    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.hasAISummary).toBe(true);
      expect(summary.aiSummaryText).toContain('comprehensive user authentication');
      expect(summary.aiSummaryText).toContain('20 ก.ย. 2568');
      expect(summary.aiModelUsed).toBeDefined();
      expect(summary.generatedAt).toBeDefined();
    }

    expect(mockAIService.generateSummary).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ message: 'feat: Add user authentication system' }),
        expect.objectContaining({ message: 'fix: Resolve login validation issues' }),
        expect.objectContaining({ message: 'refactor: Update user service for better performance' })
      ]),
      expect.any(Object)
    );
  });

  it('should group commits by date and generate daily summaries', async () => {
    // Setup commits across multiple days
    mockGitService.setMockCommits([
      {
        hash: 'day1-1',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-19T10:00:00Z'),
        message: 'feat: Initial setup',
        isMerge: false
      },
      {
        hash: 'day1-2',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-19T15:00:00Z'),
        message: 'docs: Add README',
        isMerge: false
      },
      {
        hash: 'day2-1',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-20T09:00:00Z'),
        message: 'feat: Add authentication',
        isMerge: false
      }
    ]);

    const formData = new FormData();
    formData.append('author', 'John Doe');
    formData.append('since', '2025-09-19');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn()
        .mockResolvedValueOnce('19 ก.ย. 2568\n- Project initialization and documentation')
        .mockResolvedValueOnce('20 ก.ย. 2568\n- Authentication system implementation'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 2, tokens: 200, errors: 0 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2); // Two days of summaries

    // Verify AI service was called for each day
    expect(mockAIService.generateSummary).toHaveBeenCalledTimes(2);

    if (result.data) {
      const day1Summary = result.data.find(s => s.summaryText.includes('19 ก.ย. 2568'));
      const day2Summary = result.data.find(s => s.summaryText.includes('20 ก.ย. 2568'));

      expect(day1Summary).toBeDefined();
      expect(day2Summary).toBeDefined();
      expect(day1Summary?.hasAISummary).toBe(true);
      expect(day2Summary?.hasAISummary).toBe(true);
    }
  });

  it('should persist AI summaries to database for caching', async () => {
    const formData = new FormData();
    formData.append('author', 'Cache Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('AI generated summary'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 100, errors: 0 })
    };

    const mockDatabaseService = {
      saveDailySummary: jest.fn().mockResolvedValue(undefined),
      getDailySummaries: jest.fn().mockResolvedValue([]),
      saveAISummary: jest.fn().mockResolvedValue(undefined),
      getAISummary: jest.fn().mockResolvedValue(null),
      deleteAISummaries: jest.fn().mockResolvedValue(undefined)
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result.success).toBe(true);
    expect(mockDatabaseService.saveAISummary).toHaveBeenCalled();
    expect(mockDatabaseService.saveDailySummary).toHaveBeenCalled();
  });

  it('should retrieve cached AI summaries on subsequent requests', async () => {
    const formData = new FormData();
    formData.append('author', 'Cached User');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const cachedSummary = {
      id: 1,
      authorName: 'Cached User',
      summaryDate: new Date('2025-09-20'),
      commitHashList: JSON.stringify(['abc123']),
      aiSummaryText: 'Cached AI summary',
      modelUsed: 'openai/gpt-4o-mini',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockDatabaseService = {
      getAISummary: jest.fn().mockResolvedValue(cachedSummary),
      getDailySummaries: jest.fn().mockResolvedValue([
        {
          authorName: 'Cached User',
          summaryDate: new Date('2025-09-20'),
          summaryText: 'Basic summary',
          repositoryUrl: 'test-repo',
          hasAISummary: true,
          aiSummaryId: 1
        }
      ]),
      saveDailySummary: jest.fn(),
      saveAISummary: jest.fn(),
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

  it('should handle mixed scenarios with some cached and some new summaries', async () => {
    // Setup commits for two days
    mockGitService.setMockCommits([
      {
        hash: 'cached-day',
        author: 'Mixed Test',
        email: 'test@example.com',
        date: new Date('2025-09-19T10:00:00Z'),
        message: 'Cached commit',
        isMerge: false
      },
      {
        hash: 'new-day',
        author: 'Mixed Test',
        email: 'test@example.com',
        date: new Date('2025-09-20T10:00:00Z'),
        message: 'New commit',
        isMerge: false
      }
    ]);

    const formData = new FormData();
    formData.append('author', 'Mixed Test');
    formData.append('since', '2025-09-19');
    formData.append('useAI', 'true');

    const mockDatabaseService = {
      getAISummary: jest.fn()
        .mockImplementation((author: string, date: Date) => {
          if (date.getDate() === 19) {
            return Promise.resolve({
              id: 1,
              authorName: author,
              summaryDate: date,
              aiSummaryText: 'Cached summary for day 19',
              modelUsed: 'openai/gpt-4o-mini'
            });
          }
          return Promise.resolve(null); // No cache for day 20
        }),
      getDailySummaries: jest.fn().mockResolvedValue([]),
      saveDailySummary: jest.fn(),
      saveAISummary: jest.fn(),
      deleteAISummaries: jest.fn()
    };

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('New AI summary for day 20'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 100, errors: 0 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result.success).toBe(true);
    expect(mockAIService.generateSummary).toHaveBeenCalledTimes(1); // Only for uncached day
    expect(mockDatabaseService.getAISummary).toHaveBeenCalledTimes(2); // Check both days

    if (result.data) {
      expect(result.data).toHaveLength(2);
      const cachedSummary = result.data.find(s => s.aiSummaryText?.includes('Cached summary'));
      const newSummary = result.data.find(s => s.aiSummaryText?.includes('New AI summary'));
      
      expect(cachedSummary).toBeDefined();
      expect(newSummary).toBeDefined();
    }
  });

  it('should track API usage statistics during generation', async () => {
    const formData = new FormData();
    formData.append('author', 'Usage Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockUsageTracker = {
      recordRequest: jest.fn(),
      recordSuccess: jest.fn(),
      recordError: jest.fn()
    };

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('AI summary'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 120, errors: 0 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      usageTracker: mockUsageTracker
    });

    expect(result.success).toBe(true);
    expect(mockUsageTracker.recordRequest).toHaveBeenCalled();
    expect(mockUsageTracker.recordSuccess).toHaveBeenCalled();
  });
});
