import { useState } from 'react';

export type LoadingState = {
  isLoading: boolean;
  message: string;
};

export type UseLoadingReturn = {
  isLoading: boolean;
  message: string;
  startLoading: (message?: string) => void;
  updateMessage: (message: string) => void;
  stopLoading: () => void;
};

/**
 * useLoading hook consolidates isLoading + loadingMessage pattern
 * Provides cleaner API and prevents bugs from updating only one of the two values
 */
export function useLoading(initialMessage = ''): UseLoadingReturn {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    message: initialMessage,
  });

  const startLoading = (message = 'Loading...') => {
    setState({ isLoading: true, message });
  };

  const updateMessage = (message: string) => {
    setState(prev => ({ ...prev, message }));
  };

  const stopLoading = () => {
    setState({ isLoading: false, message: '' });
  };

  return {
    isLoading: state.isLoading,
    message: state.message,
    startLoading,
    updateMessage,
    stopLoading,
  };
}
