import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { PaletteMode } from '@mui/material';

/**
 * Theme Context Interface
 * Defines the shape of the theme context
 */
interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  setTheme: (mode: PaletteMode) => void;
}

/**
 * Theme Context
 * Provides theme state and functions to child components
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * 
 * Manages the application's theme mode (light/dark) with:
 * - Persistent storage in localStorage
 * - System preference detection
 * - Toggle functionality
 * - Automatic synchronization across tabs
 */
export const CustomThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme mode from localStorage or system preference
  const [mode, setMode] = useState<PaletteMode>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme-mode') as PaletteMode | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Default to light theme
    return 'light';
  });

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = (): void => {
    const newMode: PaletteMode = mode === 'light' ? 'dark' : 'light';
    setTheme(newMode);
  };

  /**
   * Set specific theme mode
   * @param newMode - The theme mode to set
   */
  const setTheme = (newMode: PaletteMode): void => {
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
    
    // Update document class for potential CSS customizations
    document.documentElement.setAttribute('data-theme', newMode);
    
    // Log theme change for debugging
    console.log(`Theme changed to: ${newMode}`);
  };

  /**
   * Listen for system theme changes
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (event: MediaQueryListEvent) => {
        // Only update if no saved preference exists
        const savedTheme = localStorage.getItem('theme-mode');
        if (!savedTheme) {
          setMode(event.matches ? 'dark' : 'light');
        }
      };

      // Add listener for system theme changes
      mediaQuery.addEventListener('change', handleChange);
      
      // Cleanup listener on unmount
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  /**
   * Set initial document attribute
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  /**
   * Listen for theme changes in other tabs/windows
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme-mode' && event.newValue) {
        const newMode = event.newValue as PaletteMode;
        if (newMode === 'light' || newMode === 'dark') {
          setMode(newMode);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access theme context
 * 
 * @returns Theme context value with mode, toggleTheme, and setTheme
 * @throws Error if used outside of CustomThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a CustomThemeProvider');
  }
  
  return context;
};

/**
 * Hook to get current theme mode
 * 
 * @returns Current theme mode ('light' or 'dark')
 */
export const useThemeMode = (): PaletteMode => {
  const { mode } = useTheme();
  return mode;
};

/**
 * Hook to check if dark theme is active
 * 
 * @returns True if dark theme is active
 */
export const useDarkMode = (): boolean => {
  const { mode } = useTheme();
  return mode === 'dark';
}; 