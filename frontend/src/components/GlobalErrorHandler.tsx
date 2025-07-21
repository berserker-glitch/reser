import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';

interface ErrorMessage {
  message: string;
  severity: AlertColor;
}

/**
 * GlobalErrorHandler Component
 * 
 * Listens for global error events and displays user-friendly notifications
 */
const GlobalErrorHandler: React.FC = () => {
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleGlobalError = (event: CustomEvent<ErrorMessage>) => {
      setError(event.detail);
      setOpen(true);
    };

    // Listen for custom error events
    window.addEventListener('showGlobalError', handleGlobalError as EventListener);

    // Listen for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      setError({
        message: 'Une erreur réseau est survenue. Vérifiez votre connexion.',
        severity: 'error',
      });
      setOpen(true);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Listen for online/offline events
    const handleOnline = () => {
      setError({
        message: 'Connexion rétablie',
        severity: 'success',
      });
      setOpen(true);
    };

    const handleOffline = () => {
      setError({
        message: 'Pas de connexion internet',
        severity: 'warning',
      });
      setOpen(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('showGlobalError', handleGlobalError as EventListener);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  if (!error) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={error.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {error.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalErrorHandler; 