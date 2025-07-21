import { createTheme } from '@mui/material/styles';

// Mobile-first theme that matches admin interface
const clientTheme = createTheme({
  // Color palette matching admin interface
  palette: {
    primary: {
      main: '#667eea',
      light: '#8aa4f8',
      dark: '#4c63d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#9f7ab5',
      dark: '#5c3a7c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  
  // Typography optimized for mobile
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  
  // Spacing optimized for mobile touches
  spacing: 8,
  
  // Component customizations
  components: {
    // Button optimizations
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 500,
          minHeight: 48, // Better touch target
          '@media (max-width:600px)': {
            padding: '16px 24px',
            fontSize: '1.1rem',
          },
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '1.1rem',
          minHeight: 56,
          '@media (max-width:600px)': {
            padding: '20px 32px',
            fontSize: '1.2rem',
          },
        },
      },
    },
    
    // Card optimizations
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '@media (max-width:600px)': {
            borderRadius: 12,
          },
        },
      },
    },
    
    // Paper optimizations
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          '@media (max-width:600px)': {
            borderRadius: 12,
          },
        },
      },
    },
    
    // TextField optimizations for mobile
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            fontSize: '1rem',
            minHeight: 48,
            '@media (max-width:600px)': {
              fontSize: '1.1rem',
              minHeight: 56, // Better touch target
            },
          },
        },
      },
    },
    
    // Chip optimizations
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          height: 32,
          '@media (max-width:600px)': {
            height: 36,
            fontSize: '0.9rem',
          },
        },
      },
    },
    
    // Avatar optimizations
    MuiAvatar: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            width: 48,
            height: 48,
          },
        },
      },
    },
    
    // Tab optimizations for mobile
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          fontSize: '0.9rem',
          '@media (max-width:600px)': {
            minHeight: 56,
            fontSize: '1rem',
          },
        },
      },
    },
    
    // Dialog optimizations for mobile
    MuiDialog: {
      styleOverrides: {
        paper: {
          '@media (max-width:600px)': {
            margin: 16,
            width: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 32px)',
          },
        },
      },
    },
    
    // List item optimizations for mobile
    MuiListItem: {
      styleOverrides: {
        root: {
          minHeight: 56,
          '@media (max-width:600px)': {
            minHeight: 64,
          },
        },
      },
    },
  },
  
  // Breakpoints
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default clientTheme; 