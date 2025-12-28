/**
 * @format
 */

import { renderHook, act } from '@testing-library/react-native';
import { useLoading } from '../../src/hooks/useLoading';

describe('useLoading', () => {
  it('initializes with isLoading=false and empty message', () => {
    const { result } = renderHook(() => useLoading());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.message).toBe('');
  });

  it('accepts initial message', () => {
    const { result } = renderHook(() => useLoading('Initial message'));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.message).toBe('Initial message');
  });

  it('startLoading sets isLoading=true and updates message', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading('Loading data...');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.message).toBe('Loading data...');
  });

  it('startLoading uses default message when not provided', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.message).toBe('Loading...');
  });

  it('updateMessage changes message while keeping isLoading state', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading('Step 1');
    });

    act(() => {
      result.current.updateMessage('Step 2');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.message).toBe('Step 2');
  });

  it('stopLoading resets both isLoading and message', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading('Loading...');
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.stopLoading();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.message).toBe('');
  });

  it('handles multiple start/stop cycles', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading('First load');
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.stopLoading();
    });
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.startLoading('Second load');
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.message).toBe('Second load');
  });

  it('updateMessage works without calling startLoading first', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.updateMessage('Message without loading');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.message).toBe('Message without loading');
  });
});
