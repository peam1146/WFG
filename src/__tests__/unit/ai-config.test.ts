// Unit tests for AI configuration management
// Tests the AIConfigService and environment configuration handling

import { AIConfigService, getAIConfigService, resetAIConfigService } from '@/lib/services/ai-config';
import { DatabaseService } from '@/lib/services/database';
import { AIEnvironmentConfig, AIModelConfiguration, AIModelStatus } from '@/types/ai-config';
import { APIUsageStats } from '@/types/api-usage';

// Mock DatabaseService
jest.mock('@/lib/services/database');
const MockedDatabaseService = DatabaseService as jest.MockedClass<typeof DatabaseService>;

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('AIConfigService', () => {
  let aiConfigService: AIConfigService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Reset environment to defaults
    process.env.AI_ENABLED = 'true';
    process.env.AI_MODEL_PRIMARY = 'openai/gpt-4o-mini';
    process.env.AI_MODEL_FALLBACK = 'anthropic/claude-3-haiku';
    process.env.AI_MAX_TOKENS = '1000';
    process.env.AI_TEMPERATURE = '0.3';
    process.env.OPENROUTER_API_KEY = 'sk-or-test-key';
    process.env.AI_TIMEOUT = '30000';

    // Create mock database service
    mockDatabaseService = new MockedDatabaseService() as jest.Mocked<DatabaseService>;
    mockDatabaseService.getTodayAPIUsageStats.mockResolvedValue({
      requests: 10,
      tokens: 5000,
      errors: 0,
      averageLatency: 1500,
      successRate: 100
    });

    // Create service instance
    aiConfigService = new AIConfigService(mockDatabaseService);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
    resetAIConfigService();
  });

  describe('Environment Configuration Loading', () => {
    it('should load default configuration from environment variables', () => {
      const config = aiConfigService.getEnvironmentConfig();

      expect(config).toEqual({
        enabled: true,
        primaryModel: 'openai/gpt-4o-mini',
        fallbackModel: 'anthropic/claude-3-haiku',
        maxTokens: 1000,
        temperature: 0.3,
        apiKey: 'sk-or-test-key',
        timeout: 30000
      });
    });

    it('should handle missing environment variables with defaults', () => {
      delete process.env.AI_MODEL_PRIMARY;
      delete process.env.AI_MAX_TOKENS;
      delete process.env.AI_TEMPERATURE;
      delete process.env.AI_TIMEOUT;

      const service = new AIConfigService(mockDatabaseService);
      const config = service.getEnvironmentConfig();

      expect(config.primaryModel).toBe('openai/gpt-4o-mini');
      expect(config.maxTokens).toBe(1000);
      expect(config.temperature).toBe(0.3);
      expect(config.timeout).toBe(30000);
    });

    it('should parse numeric environment variables correctly', () => {
      process.env.AI_MAX_TOKENS = '2000';
      process.env.AI_TEMPERATURE = '0.7';
      process.env.AI_TIMEOUT = '45000';

      const service = new AIConfigService(mockDatabaseService);
      const config = service.getEnvironmentConfig();

      expect(config.maxTokens).toBe(2000);
      expect(config.temperature).toBe(0.7);
      expect(config.timeout).toBe(45000);
    });

    it('should handle AI_ENABLED flag correctly', () => {
      process.env.AI_ENABLED = 'false';
      const service1 = new AIConfigService(mockDatabaseService);
      expect(service1.getEnvironmentConfig().enabled).toBe(false);

      process.env.AI_ENABLED = 'true';
      const service2 = new AIConfigService(mockDatabaseService);
      expect(service2.getEnvironmentConfig().enabled).toBe(true);

      delete process.env.AI_ENABLED;
      const service3 = new AIConfigService(mockDatabaseService);
      expect(service3.getEnvironmentConfig().enabled).toBe(true); // Default to true
    });
  });

  describe('Model Status Retrieval', () => {
    it('should return complete model status', async () => {
      const status = await aiConfigService.getModelStatus();

      expect(status).toEqual({
        currentModel: 'openai/gpt-4o-mini',
        fallbackModel: 'anthropic/claude-3-haiku',
        isAIEnabled: true,
        todayUsage: {
          requests: 10,
          tokens: 5000,
          errors: 0,
          averageLatency: 1500,
          successRate: 100
        },
        lastError: undefined
      });

      expect(mockDatabaseService.getTodayAPIUsageStats).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      mockDatabaseService.getTodayAPIUsageStats.mockRejectedValue(new Error('Database error'));

      await expect(aiConfigService.getModelStatus()).rejects.toThrow('Failed to retrieve AI model status');
    });

    it('should return disabled status when AI is disabled', async () => {
      process.env.AI_ENABLED = 'false';
      const service = new AIConfigService(mockDatabaseService);

      const status = await service.getModelStatus();

      expect(status.isAIEnabled).toBe(false);
    });
  });

  describe('Model Configuration', () => {
    it('should create model configuration from environment', async () => {
      const currentModel = await aiConfigService.getCurrentModel();

      expect(currentModel).toEqual({
        id: 1,
        modelIdentifier: 'openai/gpt-4o-mini',
        providerName: 'openai',
        maxTokens: 1000,
        temperature: 0.3,
        isActive: true,
        isPrimary: true,
        createdAt: expect.any(Date)
      });
    });

    it('should create fallback model configuration', async () => {
      const fallbackModel = await aiConfigService.getFallbackModel();

      expect(fallbackModel).toEqual({
        id: 2,
        modelIdentifier: 'anthropic/claude-3-haiku',
        providerName: 'anthropic',
        maxTokens: 1000,
        temperature: 0.3,
        isActive: true,
        isPrimary: false,
        createdAt: expect.any(Date)
      });
    });

    it('should handle models without provider prefix', async () => {
      process.env.AI_MODEL_PRIMARY = 'gpt-4o-mini';
      const service = new AIConfigService(mockDatabaseService);

      const currentModel = await service.getCurrentModel();

      expect(currentModel?.providerName).toBe('openrouter');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', async () => {
      const validation = await aiConfigService.validateConfiguration();

      expect(validation).toEqual({
        isValid: true,
        errors: [],
        warnings: []
      });
    });

    it('should detect missing API key', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const service = new AIConfigService(mockDatabaseService);

      const validation = await service.validateConfiguration();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('OPENROUTER_API_KEY environment variable is required');
    });

    it('should detect missing primary model', async () => {
      delete process.env.AI_MODEL_PRIMARY;
      const service = new AIConfigService(mockDatabaseService);

      const validation = await service.validateConfiguration();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('AI_MODEL_PRIMARY environment variable is required');
    });

    it('should warn about invalid token limits', async () => {
      process.env.AI_MAX_TOKENS = '50';
      const service = new AIConfigService(mockDatabaseService);

      const validation = await service.validateConfiguration();

      expect(validation.warnings).toContain('AI_MAX_TOKENS should be between 100 and 8000');
    });

    it('should warn about invalid temperature', async () => {
      process.env.AI_TEMPERATURE = '3.0';
      const service = new AIConfigService(mockDatabaseService);

      const validation = await service.validateConfiguration();

      expect(validation.warnings).toContain('AI_TEMPERATURE should be between 0 and 2');
    });

    it('should warn about short timeout', async () => {
      process.env.AI_TIMEOUT = '1000';
      const service = new AIConfigService(mockDatabaseService);

      const validation = await service.validateConfiguration();

      expect(validation.warnings).toContain('AI timeout less than 5 seconds may cause frequent failures');
    });

    it('should warn about incorrect API key format', async () => {
      process.env.OPENROUTER_API_KEY = 'invalid-key-format';
      const service = new AIConfigService(mockDatabaseService);

      const validation = await service.validateConfiguration();

      expect(validation.warnings).toContain('API key format may be incorrect for OpenRouter');
    });

    it('should warn when AI is disabled', async () => {
      process.env.AI_ENABLED = 'false';
      const service = new AIConfigService(mockDatabaseService);

      const validation = await service.validateConfiguration();

      expect(validation.warnings).toContain('AI functionality is disabled');
    });
  });

  describe('Generation Configuration', () => {
    it('should return generation config with defaults', () => {
      const config = aiConfigService.getGenerationConfig();

      expect(config).toEqual({
        model: 'openai/gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.3,
        timeout: 30000
      });
    });

    it('should allow model override', () => {
      const config = aiConfigService.getGenerationConfig('anthropic/claude-3-haiku');

      expect(config.model).toBe('anthropic/claude-3-haiku');
      expect(config.maxTokens).toBe(1000);
      expect(config.temperature).toBe(0.3);
      expect(config.timeout).toBe(30000);
    });
  });

  describe('AI Enabled Check', () => {
    it('should return true when AI is enabled', () => {
      expect(aiConfigService.isAIEnabled()).toBe(true);
    });

    it('should return false when AI is disabled', () => {
      process.env.AI_ENABLED = 'false';
      const service = new AIConfigService(mockDatabaseService);

      expect(service.isAIEnabled()).toBe(false);
    });
  });

  describe('Configuration Updates', () => {
    it('should allow updating environment configuration', () => {
      const originalConfig = aiConfigService.getEnvironmentConfig();
      
      aiConfigService.updateEnvironmentConfig({
        maxTokens: 2000,
        temperature: 0.7
      });

      const updatedConfig = aiConfigService.getEnvironmentConfig();

      expect(updatedConfig.maxTokens).toBe(2000);
      expect(updatedConfig.temperature).toBe(0.7);
      expect(updatedConfig.primaryModel).toBe(originalConfig.primaryModel); // Unchanged
    });

    it('should preserve other config values when updating', () => {
      aiConfigService.updateEnvironmentConfig({ maxTokens: 1500 });

      const config = aiConfigService.getEnvironmentConfig();

      expect(config.maxTokens).toBe(1500);
      expect(config.primaryModel).toBe('openai/gpt-4o-mini');
      expect(config.temperature).toBe(0.3);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getAIConfigService', () => {
      const instance1 = getAIConfigService();
      const instance2 = getAIConfigService();

      expect(instance1).toBe(instance2);
    });

    it('should reset singleton when resetAIConfigService is called', () => {
      const instance1 = getAIConfigService();
      resetAIConfigService();
      const instance2 = getAIConfigService();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database service errors in getModelStatus', async () => {
      mockDatabaseService.getTodayAPIUsageStats.mockRejectedValue(new Error('Connection failed'));

      await expect(aiConfigService.getModelStatus()).rejects.toThrow('Failed to retrieve AI model status');
    });

    it('should handle validation errors gracefully', async () => {
      // Mock a scenario where model loading fails
      jest.spyOn(aiConfigService, 'getCurrentModel').mockRejectedValue(new Error('Model load failed'));

      const validation = await aiConfigService.validateConfiguration();

      expect(validation.errors).toContain('Failed to load current AI model configuration');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty API key', () => {
      process.env.OPENROUTER_API_KEY = '';
      const service = new AIConfigService(mockDatabaseService);

      const config = service.getEnvironmentConfig();
      expect(config.apiKey).toBe('');
    });

    it('should handle invalid numeric values', () => {
      process.env.AI_MAX_TOKENS = 'invalid';
      process.env.AI_TEMPERATURE = 'not-a-number';
      process.env.AI_TIMEOUT = 'invalid';

      const service = new AIConfigService(mockDatabaseService);
      const config = service.getEnvironmentConfig();

      expect(config.maxTokens).toBe(NaN);
      expect(config.temperature).toBe(NaN);
      expect(config.timeout).toBe(NaN);
    });

    it('should handle very large timeout values', () => {
      process.env.AI_TIMEOUT = '999999999';
      const service = new AIConfigService(mockDatabaseService);

      const config = service.getGenerationConfig();
      expect(config.timeout).toBe(999999999);
    });
  });
});
