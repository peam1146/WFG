// AI Status Server Actions
// Server Actions for retrieving AI model status and configuration

'use server';

import { ActionResult } from '@/types/actions';
import { AIModelStatus } from '@/types/ai-config';
import { DatabaseService } from '@/lib/services/database';
import { AIService } from '@/lib/services/ai/ai-service';
import { OpenRouterAIService } from '@/lib/services/ai/openrouter-ai';
import { MockAIService } from '@/lib/services/ai/mock-ai';
import { getAIConfigService } from '@/lib/services/ai-config';
import { logger } from '@/lib/utils/logger';

// Default services (can be injected for testing)
const defaultDatabaseService = new DatabaseService();

/**
 * Server Action to get current AI model status and usage statistics
 * @param injectedServices - Optional services for testing
 * @returns ActionResult with AIModelStatus or error
 */
export async function getAIModelStatus(
  injectedServices?: {
    databaseService?: DatabaseService;
    aiService?: AIService;
    configService?: any;
    usageService?: any;
    errorService?: any;
  }
): Promise<ActionResult<AIModelStatus>> {
  try {
    // Use injected services for testing or default services
    const databaseService = injectedServices?.databaseService || defaultDatabaseService;
    const configService = injectedServices?.configService || getAIConfigService();
    
    logger.debug('Retrieving AI model status');

    // Get current configuration
    const envConfig = configService.getEnvironmentConfig();
    
    // Get today's usage statistics
    const todayUsage = await databaseService.getTodayAPIUsageStats();
    
    // Test AI service availability
    let isAIEnabled = envConfig.enabled;
    let lastError: string | undefined;

    if (isAIEnabled) {
      try {
        const aiService = injectedServices?.aiService || await createAIService();
        const isAvailable = await aiService.isAvailable();
        
        if (!isAvailable) {
          isAIEnabled = false;
          lastError = 'AI service is not responding';
        }
      } catch (error) {
        isAIEnabled = false;
        lastError = error instanceof Error ? error.message : 'AI service connection failed';
        
        logger.warn('AI service availability check failed', {
          error: lastError
        });
      }
    }

    // Get last error from usage tracking if not already set
    if (!lastError && todayUsage.errors > 0) {
      lastError = await getLastErrorFromUsage(databaseService);
    }

    const status: AIModelStatus = {
      currentModel: envConfig.primaryModel,
      fallbackModel: envConfig.fallbackModel,
      isAIEnabled,
      todayUsage,
      lastError
    };

    logger.debug('AI model status retrieved successfully', {
      currentModel: status.currentModel,
      isEnabled: status.isAIEnabled,
      todayRequests: status.todayUsage.requests,
      todayErrors: status.todayUsage.errors
    });

    return {
      success: true,
      data: status
    };

  } catch (error) {
    logger.error('getAIModelStatus error:', {
      error: error instanceof Error ? error.message : String(error)
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Database')) {
        return {
          success: false,
          error: 'Failed to retrieve usage statistics',
          code: 'DATABASE_ERROR'
        };
      }

      if (error.message.includes('Config')) {
        return {
          success: false,
          error: 'AI configuration error',
          code: 'AI_CONFIG_ERROR'
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get AI model status',
      code: 'AI_STATUS_ERROR'
    };
  }
}

/**
 * Helper function to create AI service instance
 * @returns Promise resolving to AIService instance
 */
async function createAIService(): Promise<AIService> {
  const configService = getAIConfigService();
  
  if (!configService.isAIEnabled()) {
    return new MockAIService();
  }

  try {
    const config = configService.getEnvironmentConfig();
    
    if (!config.apiKey) {
      logger.debug('No API key configured, using mock AI service for status check');
      return new MockAIService();
    }

    return new OpenRouterAIService({
      apiKey: config.apiKey,
      timeout: 5000 // Shorter timeout for status checks
    });
  } catch (error) {
    logger.warn('Failed to create AI service for status check, using mock', {
      error: error instanceof Error ? error.message : String(error)
    });
    return new MockAIService();
  }
}

/**
 * Get the most recent error message from API usage tracking
 * @param databaseService - Database service instance
 * @returns Promise resolving to last error message or undefined
 */
async function getLastErrorFromUsage(databaseService: DatabaseService): Promise<string | undefined> {
  try {
    // This would require a new method in DatabaseService to get recent errors
    // For now, we'll return undefined and implement this later if needed
    return undefined;
  } catch (error) {
    logger.debug('Failed to get last error from usage tracking', {
      error: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  }
}

/**
 * Server Action to validate AI configuration
 * @returns ActionResult with validation result
 */
export async function validateAIConfiguration(): Promise<ActionResult<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}>> {
  try {
    const configService = getAIConfigService();
    const validationResult = await configService.validateConfiguration();

    logger.debug('AI configuration validation completed', {
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length
    });

    return {
      success: true,
      data: validationResult
    };

  } catch (error) {
    logger.error('validateAIConfiguration error:', {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate AI configuration',
      code: 'VALIDATION_ERROR'
    };
  }
}

/**
 * Server Action to test AI service connection
 * @returns ActionResult with connection test result
 */
export async function testAIConnection(): Promise<ActionResult<{
  isConnected: boolean;
  responseTime?: number;
  model?: string;
  error?: string;
}>> {
  try {
    const configService = getAIConfigService();
    
    if (!configService.isAIEnabled()) {
      return {
        success: true,
        data: {
          isConnected: false,
          error: 'AI functionality is disabled'
        }
      };
    }

    const aiService = await createAIService();
    const startTime = Date.now();
    
    try {
      const isConnected = await aiService.testConnection();
      const responseTime = Date.now() - startTime;
      const config = configService.getEnvironmentConfig();

      logger.info('AI connection test completed', {
        isConnected,
        responseTime,
        model: config.primaryModel
      });

      return {
        success: true,
        data: {
          isConnected,
          responseTime,
          model: config.primaryModel
        }
      };

    } catch (connectionError) {
      const responseTime = Date.now() - startTime;
      const errorMessage = connectionError instanceof Error ? connectionError.message : String(connectionError);

      logger.warn('AI connection test failed', {
        responseTime,
        error: errorMessage
      });

      return {
        success: true,
        data: {
          isConnected: false,
          responseTime,
          error: errorMessage
        }
      };
    }

  } catch (error) {
    logger.error('testAIConnection error:', {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test AI connection',
      code: 'CONNECTION_TEST_ERROR'
    };
  }
}
