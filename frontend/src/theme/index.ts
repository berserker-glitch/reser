import { createTheme } from '@mui/material/styles';
import type { Theme, PaletteMode } from '@mui/material/styles';

/**
 * Creates a theme based on the specified mode (light or dark)
 * @param mode - The palette mode ('light' or 'dark')
 * @returns A Material-UI theme object
 */
export const createAppTheme = (mode: PaletteMode): Theme => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
    primary: {
      main: '#1860ff',
      light: '#5084ff',
      dark: '#0043cc',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#fff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#fff',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#fff',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#fff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#fff',
    },
    background: {
      default: isLight ? '#e5e5e5' : '#121212',
      paper: isLight ? '#ffffff' : '#1e1e1e',
    },
    text: {
      primary: isLight ? '#4a4a4a' : 'rgba(255, 255, 255, 0.87)',
      secondary: isLight ? 'rgba(74, 74, 74, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 700,
      lineHeight: 1.167,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 700,
      lineHeight: 1.167,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.235,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.334,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 700,
      lineHeight: 1.6,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.75,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'uppercase',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 2.66,
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        'html, body': {
          border: 'none',
          outline: 'none',
        },
        '*:focus, *:focus-visible': {
          outline: 'none !important',
          border: 'none !important',
        },
      },
    },
          MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#ffffff' : '#1e1e1e',
            color: isLight ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
        },
      },
    },
          MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isLight ? '#ffffff' : '#1e1e1e',
            border: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            border: 'none',
            outline: 'none',
            backgroundColor: isLight ? '#ffffff' : '#1e1e1e',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: 'none',
            backgroundColor: isLight ? '#ffffff' : '#1e1e1e',
            boxShadow: isLight 
              ? '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)'
              : '0px 2px 1px -1px rgba(255,255,255,0.1), 0px 1px 1px 0px rgba(255,255,255,0.05), 0px 1px 3px 0px rgba(255,255,255,0.08)',
          },
        },
      },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
          },
        },
      },
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  });
};

// Default light theme for backward compatibility
export const theme = createAppTheme('light');

export default theme; 