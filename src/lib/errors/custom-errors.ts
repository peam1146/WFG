// Custom error classes for specific error types
// Provides structured error handling with context and recovery suggestions

import { logger } from '@/lib/utils/logger';

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly userMessage: string;
  
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    context: Record<string, any> = {},
    recoverable: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date();
    this.recoverable = recoverable;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Log error creation
    logger.error(`${this.constructor.name} created`, {
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      recoverable: this.recoverable
    }, this);
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      code: this.code,
      message: this.userMessage,
      timestamp: this.timestamp.toISOString(),
      recoverable: this.recoverable,
      ...(process.env.NODE_ENV === 'development' && {
        details: this.message,
        context: this.context,
        stack: this.stack
      })
    };
  }

  /**
   * Get recovery suggestions for the user
   */
  abstract getRecoverySuggestions(): string[];
}

/**
 * Git-related errors
 */
export class GitError extends AppError {
  readonly code = 'GIT_ERROR';
  readonly statusCode = 400;
  readonly userMessage: string;

  constructor(
    operation: string,
    message: string,
    context: Record<string, any> = {}
  ) {
    super(`Git operation '${operation}' failed: ${message}`, context);
    this.userMessage = `Git operation failed. ${this.getSimplifiedMessage(message)}`;
  }

  private getSimplifiedMessage(message: string): string {
    if (message.includes('not a git repository')) {
      return 'The specified directory is not a Git repository.';
    }
    if (message.includes('fatal:')) {
      return 'Git command failed. Please check your repository.';
    }
    if (message.includes('permission denied')) {
      return 'Permission denied. Please check repository access.';
    }
    return 'Please try again or check your repository.';
  }

  getRecoverySuggestions(): string[] {
    const suggestions = ['Verify the repository path is correct'];
    
    if (this.message.includes('not a git repository')) {
      suggestions.push('Ensure the directory contains a .git folder');
      suggestions.push('Initialize Git repository with: git init');
    }
    
    if (this.message.includes('permission denied')) {
      suggestions.push('Check file and directory permissions');
      suggestions.push('Ensure you have read access to the repository');
    }
    
    suggestions.push('Try with a different repository path');
    return suggestions;
  }
}

/**
 * Repository validation errors
 */
export class RepositoryError extends GitError {
  readonly code = 'REPOSITORY_ERROR';
  
  constructor(repositoryPath: string, reason: string) {
    super('repository validation', reason, { repositoryPath });
    this.userMessage = `Repository validation failed: ${reason}`;
  }

  getRecoverySuggestions(): string[] {
    return [
      'Check if the path exists and is accessible',
      'Ensure the directory contains a valid Git repository',
      'Try using an absolute path instead of relative path',
      'Verify you have read permissions for the directory'
    ];
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;
  readonly userMessage = 'Database operation failed. Please try again.';

  constructor(
    operation: string,
    message: string,
    context: Record<string, any> = {}
  ) {
    super(`Database operation '${operation}' failed: ${message}`, context);
  }

  getRecoverySuggestions(): string[] {
    const suggestions = ['Try the operation again'];
    
    if (this.message.includes('constraint')) {
      suggestions.push('Check if the data already exists');
      suggestions.push('Verify all required fields are provided');
    }
    
    if (this.message.includes('locked')) {
      suggestions.push('Wait a moment and try again');
      suggestions.push('Check if another process is using the database');
    }
    
    suggestions.push('Contact support if the problem persists');
    return suggestions;
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly userMessage: string;

  constructor(
    field: string,
    message: string,
    value?: any,
    context: Record<string, any> = {}
  ) {
    super(`Validation failed for '${field}': ${message}`, { field, value, ...context });
    this.userMessage = `Please check your input for ${field}. ${message}`;
  }

  getRecoverySuggestions(): string[] {
    const field = this.context.field;
    const suggestions = [`Correct the ${field} field`];
    
    if (this.message.includes('required')) {
      suggestions.push(`Ensure ${field} is not empty`);
    }
    
    if (this.message.includes('format')) {
      suggestions.push(`Check the format of ${field}`);
    }
    
    if (this.message.includes('date')) {
      suggestions.push('Use a valid date format (YYYY-MM-DD)');
      suggestions.push('Ensure the date is not in the future');
      suggestions.push('Check that the date is within the last 31 days');
    }
    
    return suggestions;
  }
}

/**
 * Server Action errors
 */
export class ServerActionError extends AppError {
  readonly code = 'SERVER_ACTION_ERROR';
  readonly statusCode = 500;
  readonly userMessage = 'Server operation failed. Please try again.';

  constructor(
    actionName: string,
    message: string,
    context: Record<string, any> = {}
  ) {
    super(`Server action '${actionName}' failed: ${message}`, { actionName, ...context });
  }

  getRecoverySuggestions(): string[] {
    return [
      'Try the operation again',
      'Check your internet connection',
      'Verify all form fields are filled correctly',
      'Refresh the page and try again',
      'Contact support if the problem persists'
    ];
  }
}

/**
 * Cache-related errors
 */
export class CacheError extends AppError {
  readonly code = 'CACHE_ERROR';
  readonly statusCode = 500;
  readonly userMessage = 'Caching operation failed. Data will be fetched fresh.';

  constructor(
    operation: string,
    message: string,
    context: Record<string, any> = {}
  ) {
    super(`Cache operation '${operation}' failed: ${message}`, context, true);
  }

  getRecoverySuggestions(): string[] {
    return [
      'The operation will continue without caching',
      'Performance may be slightly slower',
      'This is usually a temporary issue'
    ];
  }
}

/**
 * System-level errors
 */
export class SystemError extends AppError {
  readonly code = 'SYSTEM_ERROR';
  readonly statusCode = 500;
  readonly userMessage = 'A system error occurred. Please try again.';

  constructor(
    component: string,
    message: string,
    context: Record<string, any> = {}
  ) {
    super(`System error in '${component}': ${message}`, { component, ...context }, false);
  }

  getRecoverySuggestions(): string[] {
    return [
      'Try refreshing the page',
      'Check your internet connection',
      'Try again in a few minutes',
      'Contact support if the problem persists'
    ];
  }
}

/**
 * Error factory for creating appropriate error types
 */
export class ErrorFactory {
  static createGitError(operation: string, originalError: Error, context?: Record<string, any>): GitError {
    return new GitError(operation, originalError.message, { originalError: originalError.name, ...context });
  }

  static createDatabaseError(operation: string, originalError: Error, context?: Record<string, any>): DatabaseError {
    return new DatabaseError(operation, originalError.message, { originalError: originalError.name, ...context });
  }

  static createValidationError(field: string, message: string, value?: any): ValidationError {
    return new ValidationError(field, message, value);
  }

  static createServerActionError(actionName: string, originalError: Error, context?: Record<string, any>): ServerActionError {
    return new ServerActionError(actionName, originalError.message, { originalError: originalError.name, ...context });
  }

  static createFromUnknown(error: unknown, context?: Record<string, any>): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new SystemError('unknown', error.message, { originalError: error.name, ...context });
    }
    
    return new SystemError('unknown', String(error), context);
  }
}
