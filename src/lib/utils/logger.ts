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
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { LogLevel, LogEntry };
