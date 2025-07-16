import { create } from 'zustand';

interface GlobalLoadingState {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
  clearLoading: () => void;
}

/**
 * Global loading state store using Zustand
 * Manages application-wide loading states for data fetching, refreshing, etc.
 */
export const useGlobalLoadingStore = create<GlobalLoadingState>((set) => ({
  isLoading: false,
  loadingMessage: 'Chargement...',
  
  /**
   * Set loading state with optional custom message
   * @param loading - Whether loading is active
   * @param message - Optional custom loading message
   */
  setLoading: (loading: boolean, message = 'Chargement...') =>
    set({ isLoading: loading, loadingMessage: message }),
  
  /**
   * Clear loading state
   */
  clearLoading: () =>
    set({ isLoading: false, loadingMessage: 'Chargement...' }),
}));

/**
 * Custom hook for managing global loading state
 * Provides convenient methods for setting and clearing loading states
 */
export const useGlobalLoading = () => {
  const { isLoading, loadingMessage, setLoading, clearLoading } = useGlobalLoadingStore();
  
  /**
   * Show loading screen with optional message
   * @param message - Optional custom loading message
   */
  const showLoading = (message?: string) => {
    setLoading(true, message);
  };
  
  /**
   * Hide loading screen
   */
  const hideLoading = () => {
    clearLoading();
  };
  
  /**
   * Execute async function with loading state
   * @param asyncFn - Async function to execute
   * @param message - Optional loading message
   */
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    showLoading(message);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      hideLoading();
    }
  };
  
  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    withLoading,
  };
}; 