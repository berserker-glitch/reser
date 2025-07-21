import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Container,
  Paper,
  Stack,
} from '@mui/material';
import { Wifi } from '@mui/icons-material';

interface LoadingFallbackProps {
  message?: string;
  showConnectivityCheck?: boolean;
}

/**
 * LoadingFallback Component
 * 
 * Shows a loading spinner with optional connectivity check
 */
const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = "Chargement...",
  showConnectivityCheck = false,
}) => {
  const isOnline = navigator.onLine;

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 6, 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Stack spacing={3} alignItems="center">
          {/* Loading Spinner */}
          <Box sx={{ position: 'relative' }}>
            <CircularProgress 
              size={60} 
              sx={{ 
                color: 'white',
                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))',
              }} 
            />
          </Box>

          {/* Loading Message */}
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {message}
          </Typography>

          {/* Connectivity Check */}
          {showConnectivityCheck && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.8 }}>
              <Wifi 
                fontSize="small" 
                sx={{ 
                  color: isOnline ? 'lightgreen' : 'orange',
                  filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))',
                }} 
              />
              <Typography variant="caption">
                {isOnline ? 'Connecté' : 'Vérification de la connexion...'}
              </Typography>
            </Box>
          )}

          {/* Subtle Loading Tips */}
          <Typography 
            variant="caption" 
            sx={{ 
              opacity: 0.7, 
              fontStyle: 'italic',
              maxWidth: 300,
            }}
          >
            Si le chargement prend trop de temps, vérifiez votre connexion internet
          </Typography>
        </Stack>

        {/* Custom CSS for enhanced loading animation */}
        <style>
          {`
            @keyframes loadingPulse {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.05); opacity: 1; }
            }
          `}
        </style>
      </Paper>
    </Container>
  );
};

export default LoadingFallback; 