// AI Configuration Service
// Manages AI model configuration and environment-based settings

import { AIModelConfiguration, AIModelStatus, AIEnvironmentConfig } from '@/types/ai-config';
import { APIUsageStats } from '@/types/api-usage';
import { DatabaseService } from './database';
import { logger } from '@/lib/utils/logger';

export class AIConfigService {
  private databaseService: DatabaseService;
  private envConfig: AIEnvironmentConfig;

  constructor(databaseService?: DatabaseService) {
    this.databaseService = databaseService || new DatabaseService();
    this.envConfig = this.loadEnvironmentConfig();
  }

  /**
   * Get current AI model status including configuration and usage
   * @returns Promise resolving to AIModelStatus
   */
  async getModelStatus(): Promise<AIModelStatus> {
    try {
      const [currentModel, fallbackModel, todayUsage] = await Promise.all([
        this.getCurrentModel(),
        this.getFallbackModel(),
        this.databaseService.getTodayAPIUsageStats()
      ]);

      return {
        currentModel: currentModel?.modelIdentifier || this.envConfig.primaryModel,
        fallbackModel: fallbackModel?.modelIdentifier || this.envConfig.fallbackModel,
        isAIEnabled: this.envConfig.enabled,
        todayUsage,
        lastError: await this.getLastError()
      };
    } catch (error) {
      logger.error('Failed to get AI model status', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new Error('Failed to retrieve AI model status');
    }
  }

  /**
   * Get the current primary AI model configuration
   * @returns Promise resolving to AIModelConfiguration or null
   */
  async getCurrentModel(): Promise<AIModelConfiguration | null> {
    try {
      // First try to get from database
      const models = await this.getAllModels();
      const primaryModel = models.find(model => model.isPrimary && model.isActive);
      
      if (primaryModel) {
        return primaryModel;
      }

      // Fallback to environment configuration
      return this.createModelFromEnv(this.envConfig.primaryModel, true);
    } catch (error) {
      logger.warn('Failed to get current model from database, using environment config', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return this.createModelFromEnv(this.envConfig.primaryModel, true);
    }
  }

  /**
   * Get the fallback AI model configuration
   * @returns Promise resolving to AIModelConfiguration or null
   */
  async getFallbackModel(): Promise<AIModelConfiguration | null> {
    try {
      const models = await this.getAllModels();
      const fallbackModel = models.find(model => !model.isPrimary && model.isActive);
      
      if (fallbackModel) {
        return fallbackModel;
      }

      return this.createModelFromEnv(this.envConfig.fallbackModel, false);
    } catch (error) {
      logger.warn('Failed to get fallback model from database, using environment config', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return this.createModelFromEnv(this.envConfig.fallbackModel, false);
    }
  }

  /**
   * Get all available AI model configurations
   * @returns Promise resolving to array of AIModelConfiguration
   */
  async getAllModels(): Promise<AIModelConfiguration[]> {
    // Note: This would require implementing model configuration CRUD in DatabaseService
    // For now, return environment-based configurations
    return [
      this.createModelFromEnv(this.envConfig.primaryModel, true),
      this.createModelFromEnv(this.envConfig.fallbackModel, false)
    ].filter(Boolean) as AIModelConfiguration[];
  }

  /**
   * Validate current AI configuration
   * @returns Promise resolving to validation result
   */
  async validateConfiguration(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if AI is enabled
    if (!this.envConfig.enabled) {
      warnings.push('AI functionality is disabled');
    }

    // Check API key
    if (!this.envConfig.apiKey) {
      errors.push('OPENROUTER_API_KEY environment variable is required');
    } else if (!this.envConfig.apiKey.startsWith('sk-or-')) {
      warnings.push('API key format may be incorrect for OpenRouter');
    }

    // Check model configurations
    if (!this.envConfig.primaryModel) {
      errors.push('AI_MODEL_PRIMARY environment variable is required');
    }

    if (!this.envConfig.fallbackModel) {
      warnings.push('AI_MODEL_FALLBACK not configured - no fallback available');
    }

    // Check numeric configurations
    if (this.envConfig.maxTokens < 100 || this.envConfig.maxTokens > 8000) {
      warnings.push('AI_MAX_TOKENS should be between 100 and 8000');
    }

    if (this.envConfig.temperature < 0 || this.envConfig.temperature > 2) {
      warnings.push('AI_TEMPERATURE should be between 0 and 2');
    }

    if (this.envConfig.timeout < 5000) {
      warnings.push('AI timeout less than 5 seconds may cause frequent failures');
    }

    // Test model availability if no errors
    if (errors.length === 0 && this.envConfig.enabled) {
      try {
        const currentModel = await this.getCurrentModel();
        if (!currentModel) {
          errors.push('Failed to load current AI model configuration');
        }
      } catch (error) {
        errors.push('Failed to validate AI model configuration');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get AI generation configuration for API calls
   * @param modelOverride - Optional model identifier to override default
   * @returns AI generation configuration object
   */
  getGenerationConfig(modelOverride?: string) {
    return {
      model: modelOverride || this.envConfig.primaryModel,
      maxTokens: this.envConfig.maxTokens,
      temperature: this.envConfig.temperature,
      timeout: this.envConfig.timeout
    };
  }

  /**
   * Check if AI functionality is enabled
   * @returns Boolean indicating if AI is enabled
   */
  isAIEnabled(): boolean {
    return this.envConfig.enabled;
  }

  /**
   * Get environment-based AI configuration
   * @returns Current environment configuration
   */
  getEnvironmentConfig(): AIEnvironmentConfig {
    return { ...this.envConfig };
  }

  /**
   * Update environment configuration (for testing)
   * @param config - Partial configuration to update
   */
  updateEnvironmentConfig(config: Partial<AIEnvironmentConfig>): void {
    this.envConfig = { ...this.envConfig, ...config };
  }

  /**
   * Load configuration from environment variables
   * @returns AIEnvironmentConfig object
   */
  private loadEnvironmentConfig(): AIEnvironmentConfig {
    return {
      enabled: process.env.AI_ENABLED?.toLowerCase() !== 'false',
      primaryModel: process.env.AI_MODEL_PRIMARY || 'openai/gpt-4o-mini',
      fallbackModel: process.env.AI_MODEL_FALLBACK || 'anthropic/claude-3-haiku',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000'),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
      apiKey: process.env.OPENROUTER_API_KEY || '',
      timeout: parseInt(process.env.AI_TIMEOUT || '30000')
    };
  }

  /**
   * Create a model configuration from environment settings
   * @param modelIdentifier - Model identifier
   * @param isPrimary - Whether this is the primary model
   * @returns AIModelConfiguration object
   */
  private createModelFromEnv(
    modelIdentifier: string, 
    isPrimary: boolean
  ): AIModelConfiguration {
    const [provider] = modelIdentifier.split('/');
    
    return {
      id: isPrimary ? 1 : 2,
      modelIdentifier,
      providerName: provider || 'openrouter',
      maxTokens: this.envConfig.maxTokens,
      temperature: this.envConfig.temperature,
      isActive: true,
      isPrimary,
      createdAt: new Date()
    };
  }

  /**
   * Get the last error message from API usage tracking
   * @returns Promise resolving to last error message or undefined
   */
  private async getLastError(): Promise<string | undefined> {
    try {
      // This would require a method in DatabaseService to get recent errors
      // For now, return undefined
      return undefined;
    } catch (error) {
      logger.debug('Failed to get last error from usage tracking', {
        error: error instanceof Error ? error.message : String(error)
      });
      return undefined;
    }
  }
}

// Singleton instance for application use
let aiConfigServiceInstance: AIConfigService | null = null;

/**
 * Get singleton instance of AIConfigService
 * @returns AIConfigService instance
 */
export function getAIConfigService(): AIConfigService {
  if (!aiConfigServiceInstance) {
    aiConfigServiceInstance = new AIConfigService();
  }
  return aiConfigServiceInstance;
}

/**
 * Reset singleton instance (for testing)
 */
export function resetAIConfigService(): void {
  aiConfigServiceInstance = null;
}
