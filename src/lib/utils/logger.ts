// Logger utility for consistent logging across the application
// Provides structured logging with different levels and environments

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (this.isDevelopment && error.stack) {
        formatted += `\n${error.stack}`;
      }
    }
    
    return formatted;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // Don't log in test environment unless it's an error
    if (this.isTest && level !== 'error') {
      return false;
    }
    
    // In production, only log warn and error
    if (process.env.NODE_ENV === 'production' && ['debug', 'info'].includes(level)) {
      return false;
    }
    
    return true;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, context);
    console.debug(this.formatMessage(entry));
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, context);
    console.info(this.formatMessage(entry));
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, context, error);
    console.warn(this.formatMessage(entry));
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, context, error);
    console.error(this.formatMessage(entry));
  }

  // Specialized methods for common scenarios
  gitOperation(operation: string, success: boolean, context?: Record<string, any>, error?: Error): void {
    const message = `Git operation: ${operation} ${success ? 'succeeded' : 'failed'}`;
    
    if (success) {
      this.info(message, context);
    } else {
      this.error(message, context, error);
    }
  }

  databaseOperation(operation: string, success: boolean, context?: Record<string, any>, error?: Error): void {
    const message = `Database operation: ${operation} ${success ? 'succeeded' : 'failed'}`;
    
    if (success) {
      this.debug(message, context);
    } else {
      this.error(message, context, error);
    }
  }

  serverAction(actionName: string, success: boolean, context?: Record<string, any>, error?: Error): void {
    const message = `Server Action: ${actionName} ${success ? 'completed' : 'failed'}`;
    
    if (success) {
      this.info(message, context);
    } else {
      this.error(message, context, error);
    }
  }

  validation(field: string, success: boolean, context?: Record<string, any>, error?: Error): void {
    const message = `Validation: ${field} ${success ? 'passed' : 'failed'}`;
    
    if (success) {
      this.debug(message, context);
    } else {
      this.warn(message, context, error);
    }
  }

  // AI-specific logging methods
  aiOperation(operation: string, success: boolean, context?: Record<string, any>, error?: Error): void {
    const message = `AI operation: ${operation} ${success ? 'succeeded' : 'failed'}`;
    
    if (success) {
      this.info(message, context);
    } else {
      this.warn(message, context, error);
    }
  }

  aiSummaryGeneration(author: string, date: string, success: boolean, context?: Record<string, any>, error?: Error): void {
    const message = `AI summary generation for ${author} on ${date} ${success ? 'completed' : 'failed'}`;
    
    if (success) {
      this.info(message, {
        author,
        date,
        ...context
      });
    } else {
      this.warn(message, {
        author,
        date,
        ...context
      }, error);
    }
  }

  aiModelStatus(model: string, available: boolean, context?: Record<string, any>): void {
    const message = `AI model ${model} is ${available ? 'available' : 'unavailable'}`;
    
    if (available) {
      this.debug(message, { model, ...context });
    } else {
      this.warn(message, { model, ...context });
    }
  }

  aiCacheOperation(operation: string, author: string, date: string, success: boolean, context?: Record<string, any>): void {
    const message = `AI cache ${operation} for ${author} on ${date} ${success ? 'succeeded' : 'failed'}`;
    
    this.debug(message, {
      operation,
      author,
      date,
      ...context
    });
  }

  aiUsageTracking(model: string, tokens: number, duration: number, status: string, context?: Record<string, any>): void {
    const message = `AI usage: ${model} - ${tokens} tokens in ${duration}ms (${status})`;
    
    this.info(message, {
      model,
      tokens,
      duration,
      status,
      ...context
    });
  }

  aiConfigValidation(isValid: boolean, errors: string[], warnings: string[], context?: Record<string, any>): void {
    const message = `AI configuration validation ${isValid ? 'passed' : 'failed'}`;
    
    if (isValid && warnings.length === 0) {
      this.debug(message, context);
    } else if (isValid && warnings.length > 0) {
      this.warn(message, {
        warnings,
        ...context
      });
    } else {
      this.error(message, {
        errors,
        warnings,
        ...context
      });
    }
  }

  aiServiceConnection(service: string, connected: boolean, responseTime?: number, context?: Record<string, any>): void {
    const message = `AI service ${service} connection ${connected ? 'successful' : 'failed'}`;
    
    if (connected) {
      this.info(message, {
        service,
        responseTime,
        ...context
      });
    } else {
      this.warn(message, {
        service,
        responseTime,
        ...context
      });
    }
  }

  aiRateLimit(model: string, retryAfter?: number, context?: Record<string, any>): void {
    const message = `AI rate limit exceeded for ${model}${retryAfter ? ` - retry after ${retryAfter}s` : ''}`;
    
    this.warn(message, {
      model,
      retryAfter,
      ...context
    });
  }

  aiTokenUsage(model: string, tokensUsed: number, maxTokens: number, context?: Record<string, any>): void {
    const percentage = (tokensUsed / maxTokens) * 100;
    const message = `AI token usage: ${tokensUsed}/${maxTokens} (${percentage.toFixed(1)}%) for ${model}`;
    
    if (percentage > 90) {
      this.warn(message, { model, tokensUsed, maxTokens, percentage, ...context });
    } else {
      this.debug(message, { model, tokensUsed, maxTokens, percentage, ...context });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { LogLevel, LogEntry };
