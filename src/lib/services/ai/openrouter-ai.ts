// OpenRouter AI Service Implementation
// Uses Vercel AI SDK with OpenRouter provider for worklog summarization

// import { createOpenAI } from '@ai-sdk/openai';
import { logger } from "@/lib/utils/logger";
import { AIGenerationConfig } from "@/types/ai";
import { APIUsageStats } from "@/types/api-usage";
import { GitCommit } from "@/types/git";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { AIService, AIServiceConfig, AIServiceError } from "./ai-service";

export class OpenRouterAIService implements AIService {
  private client: ReturnType<typeof createOpenRouter>;
  private config: AIServiceConfig;
  private usageStats: APIUsageStats = {
    requests: 0,
    tokens: 0,
    errors: 0,
    averageLatency: 0,
    successRate: 0,
  };

  constructor(config: AIServiceConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      retryAttempts: 2,
      retryDelay: 1000,
      ...config,
    };

    // Configure OpenRouter as OpenAI-compatible provider
    this.client = createOpenRouter({
      apiKey: config.apiKey,
    });
  }

  async generateSummary(
    commits: GitCommit[],
    config?: AIGenerationConfig
  ): Promise<string> {
    const startTime = Date.now();

    try {
      logger.info("Starting AI summary generation", {
        commitCount: commits.length,
        model: config?.model || "default",
      });

      const prompt = this.buildPrompt(commits);
      const generationConfig = this.buildGenerationConfig(config);

      const result = await generateText({
        model: this.client(generationConfig.model),
        system: this.getSystemPrompt(),
        prompt: prompt,
        temperature: generationConfig.temperature,
        abortSignal: AbortSignal.timeout(this.config.timeout || 30000),
      });

      const duration = Date.now() - startTime;
      this.updateUsageStats(true, duration, result.usage?.totalTokens || 0);

      logger.info("AI summary generation completed", {
        duration,
        tokensUsed: result.usage?.totalTokens || 0,
        model: generationConfig.model,
      });

      return result.text;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateUsageStats(false, duration, 0);

      logger.error("AI summary generation failed", {
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw this.handleError(error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test with a minimal request
      const result = await generateText({
        model: this.client(this.getDefaultModel()),
        prompt: "Test",
        abortSignal: AbortSignal.timeout(5000),
      });

      return true;
    } catch (error) {
      logger.warn("AI service availability check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async getUsageStats(): Promise<APIUsageStats> {
    return { ...this.usageStats };
  }

  async testConnection(): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      logger.info("AI service connection test", { success: isAvailable });
      return isAvailable;
    } catch (error) {
      logger.error("AI service connection test failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  getSupportedModels(): string[] {
    return [
      "openai/gpt-4o-mini",
      "openai/gpt-4o",
      "openai/gpt-4-turbo",
      "anthropic/claude-3-haiku",
      "anthropic/claude-3-sonnet",
      "anthropic/claude-3-opus",
      "meta-llama/llama-3.1-8b-instruct",
      "meta-llama/llama-3.1-70b-instruct",
      "google/gemini-pro",
    ];
  }

  async validateConfig(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check API key
    if (!this.config.apiKey) {
      errors.push("API key is required");
    } else if (!this.config.apiKey.startsWith("sk-or-")) {
      warnings.push("API key format may be incorrect for OpenRouter");
    }

    // Check base URL
    if (this.config.baseUrl && !this.config.baseUrl.startsWith("https://")) {
      warnings.push("Base URL should use HTTPS for security");
    }

    // Check timeout
    if (this.config.timeout && this.config.timeout < 5000) {
      warnings.push("Timeout less than 5 seconds may cause frequent failures");
    }

    // Test connection if no errors
    if (errors.length === 0) {
      const connectionTest = await this.testConnection();
      if (!connectionTest) {
        errors.push("Failed to connect to AI service");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private buildPrompt(commits: GitCommit[]): string {
    const commitList = commits
      .map((commit) => {
        const date = commit.date.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          calendar: "buddhist",
        });
        return `- ${commit.message} (${commit.hash.substring(0, 7)})`;
      })
      .join("\n");

    const summaryDate =
      commits[0]?.date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        calendar: "buddhist",
      }) || "";

    return `
Transform these Git commits into a coherent daily work summary:

Date: ${summaryDate}
Author: ${commits[0]?.author || "Unknown"}

Commits:
${commitList}

Requirements:
1. Group related commits into logical work items
2. Explain technical changes in business terms
3. Maintain accuracy to original commit content
4. Format date as Thai Buddhist calendar
5. Keep summary concise but informative

Output format:
${summaryDate}
- [Work item 1 description]
- [Work item 2 description]
- [Additional items as needed]
    `.trim();
  }

  private getSystemPrompt(): string {
    return `You are a technical writer creating daily work summaries from Git commits.

Your role:
- Transform technical Git commits into coherent work narratives
- Group related changes into logical work items
- Explain technical work in business-friendly terms
- Maintain accuracy to the original commit content
- Use Thai Buddhist calendar format for dates

Guidelines:
- Be concise but informative
- Focus on what was accomplished, not how
- Group related commits together
- Use clear, professional language
- Preserve the Thai date format provided`;
  }

  private buildGenerationConfig(
    config?: AIGenerationConfig
  ): Required<AIGenerationConfig> {
    const defaultModel = this.getDefaultModel();

    return {
      model: config?.model || defaultModel,
      maxTokens:
        config?.maxTokens || parseInt(process.env.AI_MAX_TOKENS || "1000"),
      temperature:
        config?.temperature || parseFloat(process.env.AI_TEMPERATURE || "0.3"),
      timeout: config?.timeout || this.config.timeout || 30000,
    };
  }

  private getDefaultModel(): string {
    return process.env.AI_MODEL_PRIMARY || "openai/gpt-4o-mini";
  }

  private updateUsageStats(
    success: boolean,
    duration: number,
    tokens: number
  ): void {
    this.usageStats.requests++;
    this.usageStats.tokens += tokens;

    if (!success) {
      this.usageStats.errors++;
    }

    // Update average latency
    const totalRequests = this.usageStats.requests;
    this.usageStats.averageLatency =
      (this.usageStats.averageLatency * (totalRequests - 1) + duration) /
      totalRequests;

    // Update success rate
    this.usageStats.successRate =
      ((totalRequests - this.usageStats.errors) / totalRequests) * 100;
  }

  private handleError(error: unknown): AIServiceError {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes("rate limit")) {
        const aiError = new Error(error.message) as AIServiceError;
        aiError.code = "RATE_LIMITED";
        aiError.name = "AIServiceError";
        return aiError;
      }

      if (error.message.includes("timeout")) {
        const aiError = new Error(error.message) as AIServiceError;
        aiError.code = "TIMEOUT";
        aiError.name = "AIServiceError";
        return aiError;
      }

      if (
        error.message.includes("API key") ||
        error.message.includes("authentication")
      ) {
        const aiError = new Error(
          "Invalid API configuration"
        ) as AIServiceError;
        aiError.code = "INVALID_CONFIG";
        aiError.name = "AIServiceError";
        return aiError;
      }

      if (
        error.message.includes("network") ||
        error.message.includes("connection")
      ) {
        const aiError = new Error(error.message) as AIServiceError;
        aiError.code = "NETWORK_ERROR";
        aiError.name = "AIServiceError";
        return aiError;
      }
    }

    // Generic API error
    const aiError = new Error(
      error instanceof Error ? error.message : String(error)
    ) as AIServiceError;
    aiError.code = "API_ERROR";
    aiError.name = "AIServiceError";
    return aiError;
  }
}
