// Contract tests for AI-enhanced Server Actions
// These tests MUST FAIL initially (TDD approach)

import { generateAISummaries } from '@/lib/actions/ai-actions';
import { ActionResult } from '@/types/actions';
import { DailySummary } from '@/types/git';

describe('generateAISummaries Server Action Contract', () => {
  it('should accept FormData and return ActionResult<DailySummary[]>', async () => {
    const formData = new FormData();
    formData.append('author', 'John Doe');
    formData.append('since', '2025-09-15');
    formData.append('useAI', 'true');

    const result = await generateAISummaries(formData);

    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
    
    if (result.success) {
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      
      // Verify DailySummary structure with AI enhancements
      if (result.data && result.data.length > 0) {
        const summary = result.data[0];
        expect(summary).toHaveProperty('authorName');
        expect(summary).toHaveProperty('summaryDate');
        expect(summary).toHaveProperty('summaryText');
        expect(summary).toHaveProperty('repositoryUrl');
        expect(summary).toHaveProperty('hasAISummary');
        expect(typeof summary.hasAISummary).toBe('boolean');
      }
    } else {
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('code');
      expect(typeof result.error).toBe('string');
      expect(typeof result.code).toBe('string');
    }
  });

  it('should validate author name is required', async () => {
    const formData = new FormData();
    formData.append('since', '2025-09-15');

    const result = await generateAISummaries(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('author');
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('should validate since date is required and within 31 days', async () => {
    const formData = new FormData();
    formData.append('author', 'John Doe');
    // Test missing date
    let result = await generateAISummaries(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('since');

    // Test future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    formData.append('since', futureDate.toISOString().split('T')[0]);
    
    result = await generateAISummaries(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('future');
  });

  it('should handle AI service failures gracefully with fallback', async () => {
    const formData = new FormData();
    formData.append('author', 'Test Author');
    formData.append('since', '2025-09-15');
    formData.append('useAI', 'true');

    // Mock AI service to fail
    const mockFailingAIService = {
      generateSummary: jest.fn().mockRejectedValue(new Error('AI service unavailable')),
      isAvailable: jest.fn().mockResolvedValue(false),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 0, tokens: 0, errors: 1 })
    };

    const result = await generateAISummaries(formData, {
      aiService: mockFailingAIService
    });

    // Should still succeed with fallback to basic summaries
    expect(result.success).toBe(true);
    if (result.success && result.data) {
      // Should have basic summaries without AI enhancement
      result.data.forEach(summary => {
        expect(summary.hasAISummary).toBe(false);
        expect(summary.aiSummaryText).toBeUndefined();
      });
    }
  });

  it('should cache AI summaries for subsequent requests', async () => {
    const formData = new FormData();
    formData.append('author', 'Cache Test');
    formData.append('since', '2025-09-15');
    formData.append('useAI', 'true');

    // First request should generate AI summary
    const firstResult = await generateAISummaries(formData);
    expect(firstResult.success).toBe(true);

    // Second request should use cached result (faster)
    const startTime = Date.now();
    const secondResult = await generateAISummaries(formData);
    const duration = Date.now() - startTime;

    expect(secondResult.success).toBe(true);
    expect(duration).toBeLessThan(500); // Should be fast from cache
    
    // Results should be identical
    expect(JSON.stringify(firstResult.data)).toBe(JSON.stringify(secondResult.data));
  });

  it('should respect useAI parameter to disable AI enhancement', async () => {
    const formData = new FormData();
    formData.append('author', 'No AI Test');
    formData.append('since', '2025-09-15');
    formData.append('useAI', 'false');

    const result = await generateAISummaries(formData);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      result.data.forEach(summary => {
        expect(summary.hasAISummary).toBe(false);
        expect(summary.aiSummaryText).toBeUndefined();
      });
    }
  });

  it('should handle dependency injection for testing', async () => {
    const mockGitService = {
      getCommits: jest.fn().mockResolvedValue([]),
      validateRepository: jest.fn().mockResolvedValue(true)
    };

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

    const formData = new FormData();
    formData.append('author', 'Injection Test');
    formData.append('since', '2025-09-15');

    const result = await generateAISummaries(formData, {
      gitService: mockGitService,
      aiService: mockAIService,
      databaseService: mockDatabaseService
    });

    expect(result).toHaveProperty('success');
    expect(mockGitService.getCommits).toHaveBeenCalled();
  });
});
