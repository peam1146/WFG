// Contract tests for AI model status Server Action
// These tests MUST FAIL initially (TDD approach)

import { getAIModelStatus } from '@/lib/actions/ai-status-actions';
import { ActionResult } from '@/types/actions';
import { AIModelStatus } from '@/types/ai-config';

describe('getAIModelStatus Server Action Contract', () => {
  it('should return ActionResult<AIModelStatus> with no parameters', async () => {
    const result = await getAIModelStatus();

    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
    
    if (result.success) {
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('currentModel');
      expect(result.data).toHaveProperty('fallbackModel');
      expect(result.data).toHaveProperty('isAIEnabled');
      expect(result.data).toHaveProperty('todayUsage');
      
      // Verify AIModelStatus structure
      const status = result.data;
      expect(typeof status.currentModel).toBe('string');
      expect(typeof status.fallbackModel).toBe('string');
      expect(typeof status.isAIEnabled).toBe('boolean');
      
      // Verify usage statistics structure
      expect(status.todayUsage).toHaveProperty('requests');
      expect(status.todayUsage).toHaveProperty('tokens');
      expect(status.todayUsage).toHaveProperty('errors');
      expect(typeof status.todayUsage.requests).toBe('number');
      expect(typeof status.todayUsage.tokens).toBe('number');
      expect(typeof status.todayUsage.errors).toBe('number');
      
      // Optional lastError field
      if (status.lastError) {
        expect(typeof status.lastError).toBe('string');
      }
    } else {
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('code');
      expect(typeof result.error).toBe('string');
      expect(typeof result.code).toBe('string');
    }
  });

  it('should return current model configuration', async () => {
    const mockConfigService = {
      getCurrentModel: jest.fn().mockResolvedValue({
        modelIdentifier: 'openai/gpt-4o-mini',
        providerName: 'openrouter',
        maxTokens: 1000,
        temperature: 0.3,
        isActive: true,
        isPrimary: true
      }),
      getFallbackModel: jest.fn().mockResolvedValue({
        modelIdentifier: 'anthropic/claude-3-haiku',
        providerName: 'openrouter',
        maxTokens: 1000,
        temperature: 0.3,
        isActive: true,
        isPrimary: false
      })
    };

    const result = await getAIModelStatus({
      configService: mockConfigService
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentModel).toBe('openai/gpt-4o-mini');
      expect(result.data.fallbackModel).toBe('anthropic/claude-3-haiku');
    }
  });

  it('should return today usage statistics', async () => {
    const mockUsageService = {
      getTodayUsage: jest.fn().mockResolvedValue({
        requests: 15,
        tokens: 2500,
        errors: 1
      })
    };

    const result = await getAIModelStatus({
      usageService: mockUsageService
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.todayUsage.requests).toBe(15);
      expect(result.data.todayUsage.tokens).toBe(2500);
      expect(result.data.todayUsage.errors).toBe(1);
    }
  });

  it('should check AI service availability', async () => {
    const mockAIService = {
      isAvailable: jest.fn().mockResolvedValue(true),
      generateSummary: jest.fn(),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 0, tokens: 0, errors: 0 })
    };

    const result = await getAIModelStatus({
      aiService: mockAIService
    });

    expect(mockAIService.isAvailable).toHaveBeenCalled();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isAIEnabled).toBe(true);
    }
  });

  it('should handle AI service unavailability', async () => {
    const mockAIService = {
      isAvailable: jest.fn().mockResolvedValue(false),
      generateSummary: jest.fn(),
      getUsageStats: jest.fn().mockResolvedValue({ requests: 0, tokens: 0, errors: 5 })
    };

    const result = await getAIModelStatus({
      aiService: mockAIService
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isAIEnabled).toBe(false);
      expect(result.data.todayUsage.errors).toBeGreaterThan(0);
    }
  });

  it('should include last error message when available', async () => {
    const lastErrorMessage = 'Rate limit exceeded';
    
    const mockErrorService = {
      getLastError: jest.fn().mockResolvedValue(lastErrorMessage)
    };

    const result = await getAIModelStatus({
      errorService: mockErrorService
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lastError).toBe(lastErrorMessage);
    }
  });

  it('should handle configuration service errors gracefully', async () => {
    const mockConfigService = {
      getCurrentModel: jest.fn().mockRejectedValue(new Error('Config service unavailable')),
      getFallbackModel: jest.fn().mockRejectedValue(new Error('Config service unavailable'))
    };

    const result = await getAIModelStatus({
      configService: mockConfigService
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Config');
    expect(result.code).toBe('AI_CONFIG_ERROR');
  });

  it('should return zero usage stats when no data available', async () => {
    const mockUsageService = {
      getTodayUsage: jest.fn().mockResolvedValue({
        requests: 0,
        tokens: 0,
        errors: 0
      })
    };

    const result = await getAIModelStatus({
      usageService: mockUsageService
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.todayUsage.requests).toBe(0);
      expect(result.data.todayUsage.tokens).toBe(0);
      expect(result.data.todayUsage.errors).toBe(0);
    }
  });

  it('should handle environment-based configuration', async () => {
    // Mock environment variables
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      AI_ENABLED: 'false',
      AI_MODEL_PRIMARY: 'test/model',
      AI_MODEL_FALLBACK: 'test/fallback'
    };

    const result = await getAIModelStatus();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isAIEnabled).toBe(false);
    }

    // Restore environment
    process.env = originalEnv;
  });

  it('should validate response format matches contract', async () => {
    const result = await getAIModelStatus();

    if (result.success) {
      const data = result.data;
      
      // Required fields
      expect(data).toHaveProperty('currentModel');
      expect(data).toHaveProperty('fallbackModel');
      expect(data).toHaveProperty('isAIEnabled');
      expect(data).toHaveProperty('todayUsage');
      
      // Usage object structure
      expect(data.todayUsage).toHaveProperty('requests');
      expect(data.todayUsage).toHaveProperty('tokens');
      expect(data.todayUsage).toHaveProperty('errors');
      
      // Type validation
      expect(typeof data.currentModel).toBe('string');
      expect(typeof data.fallbackModel).toBe('string');
      expect(typeof data.isAIEnabled).toBe('boolean');
      expect(typeof data.todayUsage.requests).toBe('number');
      expect(typeof data.todayUsage.tokens).toBe('number');
      expect(typeof data.todayUsage.errors).toBe('number');
      
      // Optional fields type validation
      if (data.lastError !== undefined) {
        expect(typeof data.lastError).toBe('string');
      }
    }
  });
});
