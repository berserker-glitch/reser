import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useGlobalLoading } from './useGlobalLoading';
import { useEffect } from 'react';

interface UseEnhancedQueryOptions<TData, TError> extends UseQueryOptions<TData, TError> {
  /**
   * Whether to show global loading screen for this query
   */
  useGlobalLoading?: boolean;
  /**
   * Custom message for global loading screen
   */
  globalLoadingMessage?: string;
  /**
   * Whether to show global loading only on initial load (not on refetch)
   */
  globalLoadingOnInitialOnly?: boolean;
}

/**
 * Enhanced useQuery hook that can optionally trigger global loading state
 * Useful for important data fetches that should show a full-screen loader
 * 
 * @param options - Enhanced query options including global loading settings
 * @returns Standard useQuery result
 */
export function useEnhancedQuery<TData = unknown, TError = Error>(
  options: UseEnhancedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const { 
    useGlobalLoading: shouldUseGlobalLoading = false,
    globalLoadingMessage = 'Chargement des données...',
    globalLoadingOnInitialOnly = true,
    ...queryOptions 
  } = options;
  
  const { showLoading, hideLoading } = useGlobalLoading();
  const queryResult = useQuery(queryOptions);
  
  useEffect(() => {
    if (!shouldUseGlobalLoading) return;
    
    const { isLoading, isFetching, isInitialLoading } = queryResult;
    
    // Determine if we should show global loading
    const shouldShowGlobalLoading = globalLoadingOnInitialOnly 
      ? isInitialLoading 
      : isLoading || isFetching;
    
    if (shouldShowGlobalLoading) {
      showLoading(globalLoadingMessage);
    } else {
      hideLoading();
    }
    
    // Cleanup on unmount
    return () => {
      hideLoading();
    };
  }, [
    queryResult.isLoading, 
    queryResult.isFetching, 
    queryResult.isInitialLoading,
    shouldUseGlobalLoading,
    globalLoadingMessage,
    globalLoadingOnInitialOnly,
    showLoading,
    hideLoading
  ]);
  
  return queryResult;
} 