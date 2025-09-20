// Error handling utilities for consistent error management
// Provides error classification, formatting, and user-friendly messages

import { logger } from './logger';
import { ZodError } from 'zod';

export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Git operation errors
  GIT_ERROR = 'GIT_ERROR',
  REPOSITORY_NOT_FOUND = 'REPOSITORY_NOT_FOUND',
  GIT_COMMAND_FAILED = 'GIT_COMMAND_FAILED',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  
  // Server Action errors
  SERVER_ACTION_ERROR = 'SERVER_ACTION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // System errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  context?: Record<string, any>;
  originalError?: Error;
}

class ErrorHandler {
  /**
   * Create a standardized application error
   */
  createError(
    code: ErrorCode,
    message: string,
    userMessage: string,
    context?: Record<string, any>,
    originalError?: Error
  ): AppError {
    return {
      code,
      message,
      userMessage,
      context,
      originalError
    };
  }

  /**
   * Handle Zod validation errors
   */
  handleZodError(error: ZodError, context?: Record<string, any>): AppError {
    const firstIssue = error.issues[0];
    const field = firstIssue?.path?.join('.') || 'unknown field';
    const message = firstIssue?.message || 'Validation failed';
    
    logger.validation(field, false, context, error);
    
    return this.createError(
      ErrorCode.VALIDATION_ERROR,
      `Validation failed for ${field}: ${message}`,
      `Please check your input for ${field}. ${message}`,
      { field, issues: error.issues, ...context },
      error
    );
  }

  /**
   * Handle Git operation errors
   */
  handleGitError(operation: string, error: Error, context?: Record<string, any>): AppError {
    logger.gitOperation(operation, false, context, error);
    
    // Check for common Git error patterns
    if (error.message.includes('not a git repository')) {
      return this.createError(
        ErrorCode.REPOSITORY_NOT_FOUND,
        `Git repository not found: ${error.message}`,
        'The specified directory is not a Git repository. Please check the path.',
        { operation, ...context },
        error
      );
    }
    
    if (error.message.includes('fatal:')) {
      return this.createError(
        ErrorCode.GIT_COMMAND_FAILED,
        `Git command failed: ${error.message}`,
        'Git operation failed. Please check your repository and try again.',
        { operation, ...context },
        error
      );
    }
    
    return this.createError(
      ErrorCode.GIT_ERROR,
      `Git operation failed: ${operation} - ${error.message}`,
      'Git operation failed. Please try again or check your repository.',
      { operation, ...context },
      error
    );
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(operation: string, error: Error, context?: Record<string, any>): AppError {
    logger.databaseOperation(operation, false, context, error);
    
    // Check for common database error patterns
    if (error.message.includes('SQLITE_CONSTRAINT')) {
      return this.createError(
        ErrorCode.DATABASE_ERROR,
        `Database constraint violation: ${error.message}`,
        'This data already exists or violates database rules.',
        { operation, ...context },
        error
      );
    }
    
    if (error.message.includes('database is locked')) {
      return this.createError(
        ErrorCode.CONNECTION_FAILED,
        `Database is locked: ${error.message}`,
        'Database is temporarily unavailable. Please try again in a moment.',
        { operation, ...context },
        error
      );
    }
    
    return this.createError(
      ErrorCode.DATABASE_ERROR,
      `Database operation failed: ${operation} - ${error.message}`,
      'Database operation failed. Please try again.',
      { operation, ...context },
      error
    );
  }

  /**
   * Handle Server Action errors
   */
  handleServerActionError(actionName: string, error: Error, context?: Record<string, any>): AppError {
    logger.serverAction(actionName, false, context, error);
    
    // Handle known error types
    if (error instanceof ZodError) {
      return this.handleZodError(error, { actionName, ...context });
    }
    
    if (error.message.includes('Git')) {
      return this.handleGitError(actionName, error, context);
    }
    
    if (error.message.includes('Database') || error.message.includes('Prisma')) {
      return this.handleDatabaseError(actionName, error, context);
    }
    
    return this.createError(
      ErrorCode.SERVER_ACTION_ERROR,
      `Server action failed: ${actionName} - ${error.message}`,
      'Operation failed. Please try again.',
      { actionName, ...context },
      error
    );
  }

  /**
   * Handle unknown errors
   */
  handleUnknownError(error: unknown, context?: Record<string, any>): AppError {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    logger.error('Unknown error occurred', context, errorObj);
    
    return this.createError(
      ErrorCode.UNKNOWN_ERROR,
      `Unknown error: ${errorObj.message}`,
      'An unexpected error occurred. Please try again.',
      context,
      errorObj
    );
  }

  /**
   * Format error for client response
   */
  formatForClient(error: AppError): { success: false; error: string; code: string } {
    return {
      success: false,
      error: error.userMessage,
      code: error.code
    };
  }

  /**
   * Log error details for debugging
   */
  logError(error: AppError): void {
    logger.error(error.message, error.context, error.originalError);
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Utility function for consistent error handling in Server Actions
export function handleServerActionError(
  actionName: string,
  error: unknown,
  context?: Record<string, any>
) {
  const appError = error instanceof Error 
    ? errorHandler.handleServerActionError(actionName, error, context)
    : errorHandler.handleUnknownError(error, { actionName, ...context });
  
  errorHandler.logError(appError);
  return errorHandler.formatForClient(appError);
}
