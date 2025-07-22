import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface ErrorHandlerOptions {
  onError?: (error: Error) => void;
  autoRetry?: boolean;
  maxRetries?: number;
}

/**
 * Custom hook for handling API errors and network issues
 * Provides automatic retry logic and error reporting
 */
export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const queryClient = useQueryClient();
  const { onError, autoRetry = true, maxRetries = 3 } = options;

  useEffect(() => {
    // Global error handler for React Query
    const defaultErrorHandler = (error: Error) => {
      console.error('API Error:', error);

      // Handle specific error types
      if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        // Network error - could be connection issue
        handleNetworkError(error);
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        // Authentication error
        handleAuthError(error);
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        // Server error
        handleServerError(error);
      }

      // Call custom error handler if provided
      if (onError) {
        onError(error);
      }
    };

    // Set default options for React Query
    queryClient.setDefaultOptions({
      queries: {
        retry: autoRetry ? maxRetries : false,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      mutations: {
        retry: autoRetry ? 1 : false,
      },
    });

    // Set up global error handler
    queryClient.setMutationDefaults(['error'], {
      onError: defaultErrorHandler,
    });
  }, [queryClient, onError, autoRetry, maxRetries]);

  const handleNetworkError = (error: Error) => {
    console.warn('Network error detected:', error.message);
    
    // Check if we're online
    if (!navigator.onLine) {
      // Show offline message
      showOfflineMessage();
    } else {
      // Try to refresh after a delay
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  };

  const handleAuthError = (error: Error) => {
    console.warn('Authentication error:', error.message);
    
    // Clear all tokens and user data
    localStorage.removeItem('access_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('client_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('client_user');
    localStorage.removeItem('admin_salon'); // Clear salon data
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 2000);
  };

  const handleServerError = (error: Error) => {
    console.error('Server error:', error.message);
    
    // Show user-friendly error message
    const errorEvent = new CustomEvent('showGlobalError', {
      detail: {
        message: 'Erreur du serveur. Veuillez réessayer dans quelques instants.',
        severity: 'error',
      },
    });
    window.dispatchEvent(errorEvent);
  };

  const showOfflineMessage = () => {
    const offlineEvent = new CustomEvent('showGlobalError', {
      detail: {
        message: 'Vous êtes hors ligne. Vérifiez votre connexion internet.',
        severity: 'warning',
      },
    });
    window.dispatchEvent(offlineEvent);
  };

  // Manual error reporting function
  const reportError = (error: Error, context?: string) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Manual error report:', errorData);
    
    // You can send to an error tracking service here
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) });
  };

  return {
    reportError,
  };
};

/**
 * Async error handler for async/await operations
 */
export const withErrorHandler = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage || 'Operation failed:', error);
    
    // Show user-friendly error
    const errorEvent = new CustomEvent('showGlobalError', {
      detail: {
        message: errorMessage || 'Une erreur est survenue. Veuillez réessayer.',
        severity: 'error',
      },
    });
    window.dispatchEvent(errorEvent);
    
    return null;
  }
}; 