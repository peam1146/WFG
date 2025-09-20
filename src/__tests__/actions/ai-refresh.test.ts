// Contract tests for AI refresh Server Action
// These tests MUST FAIL initially (TDD approach)

import { refreshAISummaries } from '@/lib/actions/ai-refresh-actions';
import { ActionResult } from '@/types/actions';
import { DailySummary } from '@/types/git';

describe('refreshAISummaries Server Action Contract', () => {
  it('should accept author and since parameters and return ActionResult<DailySummary[]>', async () => {
    const author = 'John Doe';
    const since = new Date('2025-09-15');

    const result = await refreshAISummaries(author, since);

    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
    
    if (result.success) {
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      
      // Verify refreshed summaries have AI enhancement
      if (result.data && result.data.length > 0) {
        const summary = result.data[0];
        expect(summary).toHaveProperty('authorName');
        expect(summary).toHaveProperty('summaryDate');
        expect(summary).toHaveProperty('summaryText');
        expect(summary).toHaveProperty('hasAISummary');
        expect(summary.authorName).toBe(author);
      }
    } else {
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('code');
      expect(typeof result.error).toBe('string');
      expect(typeof result.code).toBe('string');
    }
  });

  it('should validate author parameter', async () => {
    const since = new Date('2025-09-15');

    // Test empty author
    let result = await refreshAISummaries('', since);
    expect(result.success).toBe(false);
    expect(result.error).toContain('author');
    expect(result.code).toBe('VALIDATION_ERROR');

    // Test null author
    result = await refreshAISummaries(null as any, since);
    expect(result.success).toBe(false);
    expect(result.error).toContain('author');
  });

  it('should validate since date parameter', async () => {
    const author = 'John Doe';

    // Test future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    const result = await refreshAISummaries(author, futureDate);
    expect(result.success).toBe(false);
    expect(result.error).toContain('future');
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('should clear existing AI summaries before regenerating', async () => {
    const author = 'Cache Clear Test';
    const since = new Date('2025-09-15');

    const mockDatabaseService = {
      deleteAISummaries: jest.fn().mockResolvedValue(undefined),
      saveDailySummary: jest.fn().mockResolvedValue(undefined),
      getDailySummaries: jest.fn().mockResolvedValue([]),
      saveAISummary: jest.fn().mockResolvedValue(undefined),
      getAISummary: jest.fn().mockResolvedValue(null)
    };

    const result = await refreshAISummaries(author, since, {
      databaseService: mockDatabaseService
    });

    expect(mockDatabaseService.deleteAISummaries).toHaveBeenCalledWith(author, since);
    expect(result).toHaveProperty('success');
  });

  it('should regenerate AI summaries with fresh API calls', async () => {
    const author = 'Fresh Generation Test';
    const since = new Date('2025-09-15');

    const mockAIService = {
      generateSummary: jest.fn().mockResolvedValue('Fresh AI summary'),
      isAvailable: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 1, tokens: 150, errors: 0 })
    };

    const mockGitService = {
      getCommits: jest.fn().mockResolvedValue([
        {
          hash: 'abc123',
          author: author,
          email: 'test@example.com',
          date: since,
          message: 'Test commit',
          isMerge: false
        }
      ]),
      validateRepository: jest.fn().mockResolvedValue(true)
    };

    const result = await refreshAISummaries(author, since, {
      aiService: mockAIService,
      gitService: mockGitService
    });

    expect(mockAIService.generateSummary).toHaveBeenCalled();
    expect(mockGitService.getCommits).toHaveBeenCalledWith(author, since, expect.any(String));
    expect(result.success).toBe(true);
  });

  it('should handle database errors gracefully', async () => {
    const author = 'DB Error Test';
    const since = new Date('2025-09-15');

    const mockDatabaseService = {
      deleteAISummaries: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      saveDailySummary: jest.fn().mockResolvedValue(undefined),
      getDailySummaries: jest.fn().mockResolvedValue([]),
      saveAISummary: jest.fn().mockResolvedValue(undefined),
      getAISummary: jest.fn().mockResolvedValue(null)
    };

    const result = await refreshAISummaries(author, since, {
      databaseService: mockDatabaseService
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Database');
    expect(result.code).toBe('DATABASE_ERROR');
  });

  it('should maintain backward compatibility when AI fails', async () => {
    const author = 'Fallback Test';
    const since = new Date('2025-09-15');

    const mockAIService = {
      generateSummary: jest.fn().mockRejectedValue(new Error('AI service down')),
      isAvailable: jest.fn().mockResolvedValue(false),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 0, tokens: 0, errors: 1 })
    };

    const result = await refreshAISummaries(author, since, {
      aiService: mockAIService
    });

    // Should still succeed with basic summaries
    expect(result.success).toBe(true);
    if (result.success && result.data) {
      result.data.forEach(summary => {
        expect(summary.hasAISummary).toBe(false);
      });
    }
  });

  it('should update cache timestamps after refresh', async () => {
    const author = 'Timestamp Test';
    const since = new Date('2025-09-15');

    const beforeRefresh = Date.now();
    
    const result = await refreshAISummaries(author, since);
    
    const afterRefresh = Date.now();

    if (result.success && result.data) {
      result.data.forEach(summary => {
        if (summary.generatedAt) {
          const generatedTime = new Date(summary.generatedAt).getTime();
          expect(generatedTime).toBeGreaterThanOrEqual(beforeRefresh);
          expect(generatedTime).toBeLessThanOrEqual(afterRefresh);
        }
      });
    }
  });
});
