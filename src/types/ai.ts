// AI Summary types and interfaces
// Defines TypeScript types for AI-enhanced worklog summaries

export interface AISummary {
  id: number;
  authorName: string;
  summaryDate: Date;
  commitHashList: string; // JSON array of commit hashes
  aiSummaryText: string;
  modelUsed: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AISummaryInput {
  authorName: string;
  summaryDate: Date;
  commitHashList: string[];
  aiSummaryText: string;
  modelUsed: string;
}

export interface AISummaryWithCommits extends AISummary {
  commits: string[]; // Parsed commit hash list
}

// Enhanced DailySummary with AI fields
export interface EnhancedDailySummary {
  id: string;
  authorName: string;
  summaryDate: Date;
  summaryText: string;
  repositoryUrl: string;
  createdAt: Date;
  updatedAt: Date;
  
  // AI Enhancement fields
  hasAISummary: boolean;
  aiSummaryId?: number;
  aiSummaryText?: string;
  aiModelUsed?: string;
  generatedAt?: Date;
}

// AI Service response types
export interface AISummaryResponse {
  success: boolean;
  summary?: string;
  model?: string;
  tokensUsed?: number;
  error?: string;
}

export interface AIGenerationConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  timeout?: number;
}

// Cache-related types
export interface AICacheEntry {
  key: string;
  summary: AISummary;
  expiresAt: Date;
}

export interface AICacheStats {
  hitCount: number;
  missCount: number;
  totalEntries: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}
