/**
 * Error handling utilities for the application
 */

export interface ErrorOptions {
  message?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  autoHide?: boolean;
  duration?: number;
}

/**
 * Show a global error notification
 */
export const showError = (message: string, options: Omit<ErrorOptions, 'message'> = {}) => {
  const errorEvent = new CustomEvent('showGlobalError', {
    detail: {
      message,
      severity: options.severity || 'error',
      ...options,
    },
  });
  window.dispatchEvent(errorEvent);
};

/**
 * Show a success notification
 */
export const showSuccess = (message: string, options: Omit<ErrorOptions, 'message' | 'severity'> = {}) => {
  showError(message, { ...options, severity: 'success' });
};

/**
 * Show a warning notification
 */
export const showWarning = (message: string, options: Omit<ErrorOptions, 'message' | 'severity'> = {}) => {
  showError(message, { ...options, severity: 'warning' });
};

/**
 * Show an info notification
 */
export const showInfo = (message: string, options: Omit<ErrorOptions, 'message' | 'severity'> = {}) => {
  showError(message, { ...options, severity: 'info' });
};

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (error: any, defaultMessage = 'Une erreur est survenue') => {
  let message = defaultMessage;
  
  if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // Map common HTTP status codes to user-friendly messages
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        message = 'Requête invalide. Vérifiez les données saisies.';
        break;
      case 401:
        message = 'Session expirée. Veuillez vous reconnecter.';
        break;
      case 403:
        message = 'Accès non autorisé.';
        break;
      case 404:
        message = 'Ressource non trouvée.';
        break;
      case 422:
        message = 'Données invalides. Vérifiez votre saisie.';
        break;
      case 429:
        message = 'Trop de requêtes. Veuillez patienter.';
        break;
      case 500:
        message = 'Erreur du serveur. Veuillez réessayer plus tard.';
        break;
      case 502:
      case 503:
      case 504:
        message = 'Service temporairement indisponible.';
        break;
    }
  }

  showError(message);
  
  // Log the actual error for debugging
  console.error('API Error:', error);
};

/**
 * Safely execute an async operation with error handling
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string,
  onError?: (error: any) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Safe async operation failed:', error);
    
    if (onError) {
      onError(error);
    } else {
      handleApiError(error, errorMessage);
    }
    
    return null;
  }
};

/**
 * Retry an operation with exponential backoff
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const backoffDelay = delay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError;
};

/**
 * Check if an error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    !error?.response &&
    (error?.code === 'NETWORK_ERROR' ||
     error?.message?.includes('Network Error') ||
     error?.message?.includes('fetch'))
  );
};

/**
 * Check if an error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return (
    error?.response?.status === 401 ||
    error?.message?.includes('Unauthorized') ||
    error?.message?.includes('Authentication')
  );
};

/**
 * Check if device is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Format error for logging/reporting
 */
export const formatErrorForLogging = (error: any, context?: string): object => {
  return {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    name: error?.name,
    status: error?.response?.status,
    data: error?.response?.data,
    url: error?.config?.url,
    method: error?.config?.method,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    location: window.location.href,
  };
};

/**
 * Report error to logging service (placeholder)
 */
export const reportError = (error: any, context?: string) => {
  const errorData = formatErrorForLogging(error, context);
  
  // Log to console for now
  console.error('Error reported:', errorData);
  
  // TODO: Send to external logging service
  // fetch('/api/errors', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(errorData),
  // }).catch(console.error);
}; 