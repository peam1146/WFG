// AI Model Configuration types and interfaces
// Defines TypeScript types for AI model management and configuration

export interface AIModelConfiguration {
  id: number;
  modelIdentifier: string;
  providerName: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: Date;
}

export interface AIModelConfigurationInput {
  modelIdentifier: string;
  providerName: string;
  maxTokens?: number;
  temperature?: number;
  isActive?: boolean;
  isPrimary?: boolean;
}

export interface AIModelStatus {
  currentModel: string;
  fallbackModel: string;
  isAIEnabled: boolean;
  todayUsage: {
    requests: number;
    tokens: number;
    errors: number;
  };
  lastError?: string;
}

export interface AIProviderConfig {
  name: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  supportedModels: string[];
  defaultModel: string;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface AIModelCapabilities {
  modelIdentifier: string;
  maxContextLength: number;
  maxOutputTokens: number;
  supportedLanguages: string[];
  costPerToken: {
    input: number;
    output: number;
  };
  averageLatency: number; // milliseconds
}

// Environment-based configuration
export interface AIEnvironmentConfig {
  enabled: boolean;
  primaryModel: string;
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
  apiKey: string;
  timeout: number;
}

// Model selection criteria
export interface AIModelSelectionCriteria {
  preferredProvider?: string;
  maxCost?: number;
  maxLatency?: number;
  requiredCapabilities?: string[];
  fallbackRequired?: boolean;
}

// Configuration validation
export interface AIConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

// Model performance metrics
export interface AIModelPerformance {
  modelIdentifier: string;
  averageResponseTime: number;
  successRate: number;
  averageTokensUsed: number;
  costEfficiency: number;
  qualityScore?: number;
  lastUpdated: Date;
}
