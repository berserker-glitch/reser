import React, { Component } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isAutoRefreshing: boolean;
  countdown: number;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI with auto-refresh functionality
 */
class ErrorBoundary extends Component<Props, State> {
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private autoRefreshTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isAutoRefreshing: false,
      countdown: 10,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Start auto-refresh countdown after first error
    if (this.state.retryCount < 3) {
      this.startAutoRefreshCountdown();
    }

    // Send error to logging service (if implemented)
    this.logErrorToService(error, errorInfo);
  }

  componentWillUnmount() {
    this.clearTimers();
  }

  private clearTimers = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.autoRefreshTimeout) {
      clearTimeout(this.autoRefreshTimeout);
      this.autoRefreshTimeout = null;
    }
  };

  private startAutoRefreshCountdown = () => {
    this.setState({ isAutoRefreshing: true, countdown: 10 });

    this.countdownInterval = setInterval(() => {
      this.setState(prevState => {
        if (prevState.countdown <= 1) {
          this.handleAutoRefresh();
          return { countdown: 0 };
        }
        return { countdown: prevState.countdown - 1 };
      });
    }, 1000);
  };

  private handleAutoRefresh = () => {
    this.clearTimers();
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isAutoRefreshing: false,
      countdown: 10,
    }));
  };

  private handleManualRefresh = () => {
    this.clearTimers();
    window.location.reload();
  };

  private handleGoHome = () => {
    this.clearTimers();
    window.location.href = '/';
  };

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // Implementation for logging service (e.g., Sentry, LogRocket, etc.)
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        retryCount: this.state.retryCount,
      };

      // Log to console for now - replace with actual service
      console.error('Error logged:', errorData);
      
      // You can send to an error tracking service here
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount, isAutoRefreshing, countdown } = this.state;

      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <ErrorIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'error.main',
                  mb: 2,
                  animation: 'pulse 2s infinite',
                }} 
              />
              <Typography variant="h4" gutterBottom color="error.main" fontWeight="bold">
                Oops! Quelque chose s'est mal passé
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Une erreur inattendue s'est produite
              </Typography>
            </Box>

            {/* Error Details */}
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                textAlign: 'left',
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                <BugReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Détails de l'erreur:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {error?.message || 'Erreur inconnue'}
              </Typography>
              {retryCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Tentatives de récupération: {retryCount}/3
                </Typography>
              )}
            </Alert>

            {/* Auto-refresh countdown */}
            {isAutoRefreshing && retryCount < 3 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">
                    Actualisation automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
                  </Typography>
                </Box>
              </Alert>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleManualRefresh}
                startIcon={<RefreshIcon />}
                size="large"
              >
                Actualiser la page
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleGoHome}
                startIcon={<HomeIcon />}
                size="large"
              >
                Retour à l'accueil
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Additional info for multiple failures */}
            {retryCount >= 3 && (
              <Alert severity="warning">
                <Typography variant="body2">
                  Plusieurs tentatives ont échoué. Veuillez vérifier votre connexion internet 
                  ou contacter le support technique si le problème persiste.
                </Typography>
              </Alert>
            )}

            {/* Tips */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              💡 Conseils: Vérifiez votre connexion internet, videz le cache de votre navigateur, 
              ou essayez de redémarrer l'application.
            </Typography>
          </Paper>

          {/* Custom CSS for pulse animation */}
          <style>
            {`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
              }
            `}
          </style>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 