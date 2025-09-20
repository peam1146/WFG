// API Usage Tracking types and interfaces
// Defines TypeScript types for monitoring AI API usage and performance

export interface APIUsageTracking {
  id: number;
  requestTimestamp: Date;
  modelUsed: string;
  tokensUsed: number;
  requestDuration: number; // milliseconds
  requestStatus: APIRequestStatus;
  errorMessage?: string;
  authorName: string;
}

export type APIRequestStatus = 'success' | 'error' | 'timeout' | 'rate_limited';

export interface APIUsageInput {
  modelUsed: string;
  tokensUsed: number;
  requestDuration: number;
  requestStatus: APIRequestStatus;
  errorMessage?: string;
  authorName: string;
}

export interface APIUsageStats {
  requests: number;
  tokens: number;
  errors: number;
  averageLatency: number;
  successRate: number;
  totalCost?: number;
}

export interface DailyUsageStats extends APIUsageStats {
  date: Date;
  breakdown: {
    byModel: Record<string, APIUsageStats>;
    byAuthor: Record<string, APIUsageStats>;
    byHour: Record<number, APIUsageStats>;
  };
}

export interface UsageTrends {
  period: 'daily' | 'weekly' | 'monthly';
  data: {
    date: Date;
    stats: APIUsageStats;
  }[];
  growth: {
    requests: number; // percentage
    tokens: number;
    errors: number;
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds
}

export interface CostAnalysis {
  period: {
    start: Date;
    end: Date;
  };
  totalCost: number;
  breakdown: {
    byModel: Record<string, number>;
    byAuthor: Record<string, number>;
    inputTokens: number;
    outputTokens: number;
  };
  projectedMonthlyCost: number;
  recommendations: string[];
}

export interface PerformanceMetrics {
  modelIdentifier: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    successRate: number;
    errorRate: number;
    timeoutRate: number;
    rateLimitRate: number;
  };
  trends: {
    latencyTrend: 'improving' | 'stable' | 'degrading';
    reliabilityTrend: 'improving' | 'stable' | 'degrading';
  };
}

export interface UsageAlert {
  id: string;
  type: 'cost_threshold' | 'rate_limit' | 'error_spike' | 'latency_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  triggeredAt: Date;
  data: Record<string, any>;
  acknowledged: boolean;
}

// Monitoring configuration
export interface UsageMonitoringConfig {
  costThresholds: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  performanceThresholds: {
    maxLatency: number; // milliseconds
    minSuccessRate: number; // percentage
    maxErrorRate: number; // percentage
  };
  alerting: {
    enabled: boolean;
    channels: ('log' | 'email' | 'webhook')[];
    cooldownPeriod: number; // minutes
  };
}

// Usage optimization suggestions
export interface UsageOptimization {
  category: 'cost' | 'performance' | 'reliability';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  estimatedSavings?: {
    cost?: number;
    latency?: number;
    tokens?: number;
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    steps: string[];
  };
}
