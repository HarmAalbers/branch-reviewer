/**
 * @format
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Text} from 'react-native';
import {ErrorBoundary} from '../../src/components/ErrorBoundary';

// Component that throws an error
function BrokenComponent() {
  throw new Error('Component crashed!');
}

// Component that works
function WorkingComponent() {
  return <Text>Working fine</Text>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error during these tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renders children when no error occurs', () => {
    const {getByText} = render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    expect(getByText('Working fine')).toBeTruthy();
  });

  it('catches error and shows fallback UI', () => {
    const {getByText, queryByText} = render(
      <ErrorBoundary componentName="TestComponent">
        <BrokenComponent />
      </ErrorBoundary>
    );

    // Error caught, fallback UI shown
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Component crashed!')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();

    // Original component not rendered
    expect(queryByText('Working fine')).toBeNull();
  });

  it('resets error state when Try Again is pressed', () => {
    let shouldThrow = true;

    function ConditionallyBrokenComponent() {
      if (shouldThrow) {
        throw new Error('First render fails');
      }
      return <Text>Now working</Text>;
    }

    const {getByText, queryByText} = render(
      <ErrorBoundary>
        <ConditionallyBrokenComponent />
      </ErrorBoundary>
    );

    // Error shown
    expect(getByText('Something went wrong')).toBeTruthy();

    // Fix the component
    shouldThrow = false;

    // Press Try Again
    fireEvent.press(getByText('Try Again'));

    // Component should re-render successfully
    expect(queryByText('Something went wrong')).toBeNull();
    expect(getByText('Now working')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <Text>Custom error UI</Text>;

    const {getByText} = render(
      <ErrorBoundary fallback={customFallback}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(getByText('Custom error UI')).toBeTruthy();
  });

  it('logs error to console with component name', () => {
    const consoleErrorSpy = console.error as jest.Mock;
    consoleErrorSpy.mockClear();

    render(
      <ErrorBoundary componentName="TestComponent">
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('ErrorBoundary caught error in TestComponent'),
      expect.any(Error),
      expect.anything()
    );
  });
});
