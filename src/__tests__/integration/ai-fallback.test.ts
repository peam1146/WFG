// Integration tests for AI service fallback behavior
// These tests MUST FAIL initially (TDD approach)

import { generateAISummaries } from '@/lib/actions/ai-actions';
import { MockGitService } from '@/lib/services/git/mock-git';
import { DatabaseService } from '@/lib/services/database';

describe('AI Service Fallback Behavior Integration', () => {
  let mockGitService: MockGitService;
  let databaseService: DatabaseService;

  beforeEach(() => {
    mockGitService = new MockGitService();
    databaseService = new DatabaseService();
    
    // Setup standard test commits
    mockGitService.setMockCommits([
      {
        hash: 'abc123',
        author: 'Fallback Test',
        email: 'test@example.com',
        date: new Date('2025-09-20T10:00:00Z'),
        message: 'feat: Add new feature',
        isMerge: false
      },
      {
        hash: 'def456',
        author: 'Fallback Test',
        email: 'test@example.com',
        date: new Date('2025-09-20T14:00:00Z'),
        message: 'fix: Bug fix',
        isMerge: false
      }
    ]);
  });

  it('should fall back to basic summaries when AI service is unavailable', async () => {
    const formData = new FormData();
    formData.append('author', 'Fallback Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockRejectedValue(new Error('AI service unavailable')),
      isAvailable: jest.fn().mockResolvedValue(false),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 0, tokens: 0, errors: 1 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    // Should still succeed with basic summaries
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);

    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.hasAISummary).toBe(false);
      expect(summary.aiSummaryText).toBeUndefined();
      expect(summary.summaryText).toContain('feat: Add new feature');
      expect(summary.summaryText).toContain('fix: Bug fix');
    }
  });

  it('should fall back when AI service times out', async () => {
    const formData = new FormData();
    formData.append('author', 'Timeout Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      ),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 0, errors: 1 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    expect(result.success).toBe(true);
    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.hasAISummary).toBe(false);
      expect(summary.summaryText).toBeDefined(); // Basic summary should exist
    }
  });

  it('should fall back when AI returns invalid response', async () => {
    const formData = new FormData();
    formData.append('author', 'Invalid Response Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue(null), // Invalid response
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 0, errors: 1 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    expect(result.success).toBe(true);
    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.hasAISummary).toBe(false);
      expect(summary.summaryText).toBeDefined();
    }
  });

  it('should fall back when AI returns empty response', async () => {
    const formData = new FormData();
    formData.append('author', 'Empty Response Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue(''), // Empty response
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 5, errors: 0 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    expect(result.success).toBe(true);
    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.hasAISummary).toBe(false);
      expect(summary.summaryText).toBeDefined();
      expect(summary.summaryText.length).toBeGreaterThan(0);
    }
  });

  it('should try fallback model before giving up', async () => {
    const formData = new FormData();
    formData.append('author', 'Fallback Model Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn()
        .mockRejectedValueOnce(new Error('Primary model failed'))
        .mockResolvedValueOnce('Fallback model success'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 2, tokens: 100, errors: 1 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    expect(result.success).toBe(true);
    expect(mockAIService.generateSummary).toHaveBeenCalledTimes(2); // Primary + fallback

    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.hasAISummary).toBe(true);
      expect(summary.aiSummaryText).toBe('Fallback model success');
    }
  });

  it('should handle rate limiting gracefully', async () => {
    const formData = new FormData();
    formData.append('author', 'Rate Limit Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockRejectedValue(new Error('Rate limit exceeded')),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 100, tokens: 50000, errors: 1 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    expect(result.success).toBe(true);
    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      expect(summary.hasAISummary).toBe(false);
      expect(summary.summaryText).toBeDefined();
    }
  });

  it('should maintain performance when falling back', async () => {
    const formData = new FormData();
    formData.append('author', 'Performance Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockRejectedValue(new Error('Service down')),
      isAvailable: jest.fn().mockResolvedValue(false),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 0, tokens: 0, errors: 1 })
    };

    const startTime = Date.now();
    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });
    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(1000); // Should be fast fallback
  });

  it('should log fallback events for monitoring', async () => {
    const formData = new FormData();
    formData.append('author', 'Logging Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockLogger = {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };

    const mockAIService = {
      generateSummary: jest.fn().mockRejectedValue(new Error('AI failed')),
      isAvailable: jest.fn().mockResolvedValue(false),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 0, tokens: 0, errors: 1 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService,
      logger: mockLogger
    });

    expect(result.success).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('AI service unavailable'),
      expect.any(Object)
    );
  });

  it('should preserve all basic summary functionality during fallback', async () => {
    const formData = new FormData();
    formData.append('author', 'Preserve Functionality Test');
    formData.append('since', '2025-09-20');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn().mockRejectedValue(new Error('AI unavailable')),
      isAvailable: jest.fn().mockResolvedValue(false),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 0, tokens: 0, errors: 1 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    expect(result.success).toBe(true);
    if (result.data && result.data.length > 0) {
      const summary = result.data[0];
      
      // All basic summary fields should be present
      expect(summary.authorName).toBe('Fallback Test');
      expect(summary.summaryDate).toBeDefined();
      expect(summary.summaryText).toBeDefined();
      expect(summary.repositoryUrl).toBeDefined();
      expect(summary.hasAISummary).toBe(false);
      
      // Summary should contain commit information
      expect(summary.summaryText).toContain('feat: Add new feature');
      expect(summary.summaryText).toContain('fix: Bug fix');
      
      // Thai date format should be preserved
      expect(summary.summaryText).toMatch(/\d{1,2}\s[ก-ฮ\.]+\s\d{4}/);
    }
  });

  it('should handle partial AI failures gracefully', async () => {
    // Setup commits for multiple days
    mockGitService.setMockCommits([
      {
        hash: 'day1',
        author: 'Partial Failure Test',
        email: 'test@example.com',
        date: new Date('2025-09-19T10:00:00Z'),
        message: 'Day 1 commit',
        isMerge: false
      },
      {
        hash: 'day2',
        author: 'Partial Failure Test',
        email: 'test@example.com',
        date: new Date('2025-09-20T10:00:00Z'),
        message: 'Day 2 commit',
        isMerge: false
      }
    ]);

    const formData = new FormData();
    formData.append('author', 'Partial Failure Test');
    formData.append('since', '2025-09-19');
    formData.append('useAI', 'true');

    const mockAIService = {
      generateSummary: jest.fn()
        .mockResolvedValueOnce('AI summary for day 1') // Success for first day
        .mockRejectedValueOnce(new Error('AI failed for day 2')), // Failure for second day
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 2, tokens: 100, errors: 1 })
    };

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: databaseService
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);

    if (result.data) {
      const day1Summary = result.data.find(s => s.summaryText.includes('19 ก.ย.'));
      const day2Summary = result.data.find(s => s.summaryText.includes('20 ก.ย.'));

      expect(day1Summary?.hasAISummary).toBe(true);
      expect(day1Summary?.aiSummaryText).toBe('AI summary for day 1');
      
      expect(day2Summary?.hasAISummary).toBe(false);
      expect(day2Summary?.summaryText).toContain('Day 2 commit');
    }
  });
});
