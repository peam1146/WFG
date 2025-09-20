// Mock AI Service Implementation
// Provides predictable AI responses for testing purposes

import { GitCommit } from '@/types/git';
import { AIGenerationConfig } from '@/types/ai';
import { APIUsageStats } from '@/types/api-usage';
import { AIService, AIServiceError } from './ai-service';
import { logger } from '@/lib/utils/logger';

export class MockAIService implements AIService {
  private mockResponses: string[] = [];
  private shouldFail: boolean = false;
  private failureType: 'timeout' | 'rate_limit' | 'api_error' | 'network' = 'api_error';
  private isServiceAvailable: boolean = true;
  private usageStats: APIUsageStats = {
    requests: 0,
    tokens: 0,
    errors: 0,
    averageLatency: 150,
    successRate: 100
  };

  constructor() {
    // Set up default mock responses
    this.setDefaultMockResponses();
  }

  async generateSummary(commits: GitCommit[], config?: AIGenerationConfig): Promise<string> {
    const startTime = Date.now();
    
    // Simulate processing delay
    await this.simulateDelay(100, 300);

    this.usageStats.requests++;

    if (this.shouldFail) {
      this.usageStats.errors++;
      this.updateSuccessRate();
      throw this.createMockError();
    }

    // Generate mock response based on commits
    const response = this.generateMockResponse(commits);
    
    // Update usage stats
    const duration = Date.now() - startTime;
    const tokens = Math.floor(response.length / 4); // Rough token estimation
    this.usageStats.tokens += tokens;
    this.usageStats.averageLatency = 
      (this.usageStats.averageLatency + duration) / 2;
    this.updateSuccessRate();

    logger.debug('Mock AI summary generated', {
      commitCount: commits.length,
      responseLength: response.length,
      tokensUsed: tokens,
      duration
    });

    return response;
  }

  async isAvailable(): Promise<boolean> {
    await this.simulateDelay(50, 100);
    return this.isServiceAvailable;
  }

  async getUsageStats(): Promise<APIUsageStats> {
    return { ...this.usageStats };
  }

  async testConnection(): Promise<boolean> {
    await this.simulateDelay(100, 200);
    return this.isServiceAvailable && !this.shouldFail;
  }

  getSupportedModels(): string[] {
    return [
      'mock/gpt-4o-mini',
      'mock/claude-3-haiku',
      'mock/test-model'
    ];
  }

  async validateConfig(): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    await this.simulateDelay(50, 100);
    
    if (this.shouldFail) {
      return {
        isValid: false,
        errors: ['Mock configuration error'],
        warnings: ['This is a mock service']
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: ['This is a mock service for testing']
    };
  }

  // Mock-specific methods for testing control

  /**
   * Set custom mock responses
   */
  setMockResponses(responses: string[]): void {
    this.mockResponses = [...responses];
  }

  /**
   * Add a single mock response
   */
  addMockResponse(response: string): void {
    this.mockResponses.push(response);
  }

  /**
   * Configure the service to fail on next request
   */
  setFailureMode(shouldFail: boolean, type: 'timeout' | 'rate_limit' | 'api_error' | 'network' = 'api_error'): void {
    this.shouldFail = shouldFail;
    this.failureType = type;
  }

  /**
   * Set service availability status
   */
  setAvailability(available: boolean): void {
    this.isServiceAvailable = available;
  }

  /**
   * Reset all mock state
   */
  reset(): void {
    this.mockResponses = [];
    this.shouldFail = false;
    this.isServiceAvailable = true;
    this.usageStats = {
      requests: 0,
      tokens: 0,
      errors: 0,
      averageLatency: 150,
      successRate: 100
    };
    this.setDefaultMockResponses();
  }

  /**
   * Get current mock configuration for debugging
   */
  getMockConfig(): {
    responseCount: number;
    shouldFail: boolean;
    failureType: string;
    isAvailable: boolean;
  } {
    return {
      responseCount: this.mockResponses.length,
      shouldFail: this.shouldFail,
      failureType: this.failureType,
      isAvailable: this.isServiceAvailable
    };
  }

  private setDefaultMockResponses(): void {
    this.mockResponses = [
      // Default response for single commit
      '20 ก.ย. 2568\n- Implemented new feature with comprehensive testing and documentation',
      
      // Default response for multiple commits
      '20 ก.ย. 2568\n- Added user authentication system with secure login validation\n- Fixed critical bugs in the payment processing module\n- Improved application performance through code optimization',
      
      // Default response for refactoring commits
      '20 ก.ย. 2568\n- Refactored codebase architecture for better maintainability\n- Updated dependencies to latest stable versions\n- Enhanced error handling across all modules',
      
      // Default response for documentation commits
      '20 ก.ย. 2568\n- Updated project documentation and API specifications\n- Added comprehensive code examples and usage guides\n- Improved developer onboarding documentation'
    ];
  }

  private generateMockResponse(commits: GitCommit[]): string {
    // If we have custom responses, use them in order
    if (this.mockResponses.length > 0) {
      const responseIndex = (this.usageStats.requests - 1) % this.mockResponses.length;
      return this.mockResponses[responseIndex];
    }

    // Generate response based on commit content
    const date = commits[0]?.date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      calendar: 'buddhist'
    }) || '20 ก.ย. 2568';

    const summaryItems = commits.map(commit => {
      // Analyze commit message for type
      const message = commit.message.toLowerCase();
      
      if (message.includes('feat:') || message.includes('add')) {
        return `- Implemented ${this.extractFeatureName(commit.message)} with comprehensive functionality`;
      } else if (message.includes('fix:') || message.includes('bug')) {
        return `- Resolved ${this.extractBugDescription(commit.message)} affecting system reliability`;
      } else if (message.includes('refactor:') || message.includes('update')) {
        return `- Refactored ${this.extractRefactorTarget(commit.message)} for improved maintainability`;
      } else if (message.includes('docs:') || message.includes('documentation')) {
        return `- Updated documentation for ${this.extractDocumentationTarget(commit.message)}`;
      } else {
        return `- Enhanced ${this.extractGeneralDescription(commit.message)}`;
      }
    });

    return `${date}\n${summaryItems.join('\n')}`;
  }

  private extractFeatureName(message: string): string {
    const match = message.match(/feat:\s*(.+)/i);
    return match ? match[1].trim() : 'new functionality';
  }

  private extractBugDescription(message: string): string {
    const match = message.match(/fix:\s*(.+)/i);
    return match ? match[1].trim() : 'critical issues';
  }

  private extractRefactorTarget(message: string): string {
    const match = message.match(/refactor:\s*(.+)/i);
    return match ? match[1].trim() : 'code structure';
  }

  private extractDocumentationTarget(message: string): string {
    const match = message.match(/docs:\s*(.+)/i);
    return match ? match[1].trim() : 'project documentation';
  }

  private extractGeneralDescription(message: string): string {
    // Remove common prefixes and return clean description
    const cleaned = message
      .replace(/^(feat|fix|docs|style|refactor|test|chore):\s*/i, '')
      .trim();
    return cleaned || 'system functionality';
  }

  private async simulateDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private createMockError(): AIServiceError {
    const error = new Error() as AIServiceError;
    error.name = 'AIServiceError';

    switch (this.failureType) {
      case 'timeout':
        error.message = 'Request timeout after 30 seconds';
        error.code = 'TIMEOUT';
        break;
      case 'rate_limit':
        error.message = 'Rate limit exceeded. Try again later.';
        error.code = 'RATE_LIMITED';
        error.retryAfter = 60;
        break;
      case 'network':
        error.message = 'Network connection failed';
        error.code = 'NETWORK_ERROR';
        break;
      default:
        error.message = 'Mock API error for testing';
        error.code = 'API_ERROR';
        error.statusCode = 500;
    }

    return error;
  }

  private updateSuccessRate(): void {
    const totalRequests = this.usageStats.requests;
    const successfulRequests = totalRequests - this.usageStats.errors;
    this.usageStats.successRate = (successfulRequests / totalRequests) * 100;
  }
}
