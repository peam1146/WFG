// AI Service Interface
// Defines the contract for AI-powered worklog summarization services

import { GitCommit } from '@/types/git';
import { AIGenerationConfig, AISummaryResponse } from '@/types/ai';
import { APIUsageStats } from '@/types/api-usage';

export interface AIService {
  /**
   * Generate an AI-enhanced summary from Git commits
   * @param commits Array of Git commits to summarize
   * @param config AI generation configuration
   * @returns Promise resolving to AI summary response
   */
  generateSummary(commits: GitCommit[], config?: AIGenerationConfig): Promise<string>;

  /**
   * Check if the AI service is currently available
   * @returns Promise resolving to availability status
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get current usage statistics for the AI service
   * @returns Promise resolving to usage stats
   */
  getUsageStats(): Promise<APIUsageStats>;

  /**
   * Test the AI service connection and configuration
   * @returns Promise resolving to test result
   */
  testConnection(): Promise<boolean>;

  /**
   * Get supported models for this AI service
   * @returns Array of supported model identifiers
   */
  getSupportedModels(): string[];

  /**
   * Validate AI service configuration
   * @returns Promise resolving to validation result
   */
  validateConfig(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

export interface AIServiceConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface AIPromptTemplate {
  system: string;
  user: string;
  variables: Record<string, string>;
}

export interface AIServiceError extends Error {
  code: 'API_ERROR' | 'RATE_LIMITED' | 'TIMEOUT' | 'INVALID_CONFIG' | 'NETWORK_ERROR';
  statusCode?: number;
  retryAfter?: number;
  details?: Record<string, any>;
}

// Factory function type for creating AI services
export type AIServiceFactory = (config: AIServiceConfig) => AIService;

// Registry for AI service implementations
export class AIServiceRegistry {
  private static services = new Map<string, AIServiceFactory>();

  static register(name: string, factory: AIServiceFactory): void {
    this.services.set(name, factory);
  }

  static create(name: string, config: AIServiceConfig): AIService {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`AI service '${name}' not found in registry`);
    }
    return factory(config);
  }

  static getAvailableServices(): string[] {
    return Array.from(this.services.keys());
  }
}
