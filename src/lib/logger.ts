/**
 * Centralized logging utility
 * Provides consistent error logging and debugging
 */

export interface LogContext {
  [key: string]: any;
}

export const logger = {
  error(message: string, error?: any, context?: LogContext) {
    const logData = {
      level: 'ERROR',
      message,
      error: error?.message || error,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    console.error(`[ERROR] ${message}`, logData);

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { custom: context } });
    // }
  },

  warn(message: string, context?: LogContext) {
    const logData = {
      level: 'WARN',
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    console.warn(`[WARN] ${message}`, logData);
  },

  info(message: string, context?: LogContext) {
    const logData = {
      level: 'INFO',
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, logData);
    }
  },

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      const logData = {
        level: 'DEBUG',
        message,
        context,
        timestamp: new Date().toISOString(),
      };
      console.debug(`[DEBUG] ${message}`, logData);
    }
  },
};

/**
 * Create a safe error message for users
 * Never expose internal errors or stack traces
 */
export function getUserFriendlyError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Map common error messages to user-friendly ones
    const errorMessages: { [key: string]: string } = {
      'Network request failed': 'Unable to connect. Please check your internet connection.',
      'Failed to fetch': 'Connection failed. Please try again.',
      'JWT expired': 'Your session has expired. Please log in again.',
      'Row Level Security policy violation': 'You do not have permission to perform this action.',
      'duplicate key value': 'This record already exists.',
      'invalid input syntax': 'Invalid data provided. Please check your input.',
    };

    for (const [key, friendly] of Object.entries(errorMessages)) {
      if (error.message.includes(key)) {
        return friendly;
      }
    }

    // For development, show original error
    if (process.env.NODE_ENV === 'development') {
      return error.message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

