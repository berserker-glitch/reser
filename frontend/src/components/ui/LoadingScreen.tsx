import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled component for the custom loader animation
const StyledLoader = styled('div')(({ theme }) => ({
  width: '100px',
  aspectRatio: '1',
  padding: '10px',
  boxSizing: 'border-box',
  display: 'grid',
  background: '#fff',
  filter: 'blur(5px) contrast(10) hue-rotate(300deg)',
  mixBlendMode: 'darken',
  
  '&::before, &::after': {
    content: '""',
    gridArea: '1/1',
    width: '40px',
    height: '40px',
    background: theme.palette.secondary.main,
    animation: 'loaderAnimation 2s infinite',
  },
  
  '&::after': {
    animationDelay: '-1s',
  },
  
  '@keyframes loaderAnimation': {
    '0%': { transform: 'translate(0, 0)' },
    '25%': { transform: 'translate(100%, 0)' },
    '50%': { transform: 'translate(100%, 100%)' },
    '75%': { transform: 'translate(0, 100%)' },
    '100%': { transform: 'translate(0, 0)' },
  },
}));

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * LoadingScreen Component
 * Displays a custom animated loader with optional message
 * 
 * @param message - Optional loading message to display
 * @param fullScreen - Whether to display as full screen overlay
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Chargement...', 
  fullScreen = true 
}) => {
  return (
    <Box
      sx={{
        position: fullScreen ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: fullScreen ? 'rgba(255, 255, 255, 0.9)' : 'background.default',
        zIndex: fullScreen ? 9999 : 1,
        backdropFilter: fullScreen ? 'blur(2px)' : 'none',
      }}
    >
      {/* Custom Loader Animation */}
      <StyledLoader />
      
      {/* Loading Message */}
      <Typography
        variant="h6"
        sx={{
          mt: 3,
          color: 'text.secondary',
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen; 