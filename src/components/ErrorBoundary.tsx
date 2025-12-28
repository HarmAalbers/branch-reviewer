import React, {Component, ErrorInfo, ReactNode} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, useColorScheme} from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorCount: number;
  lastErrorTimestamp?: number;
  errorId?: string;
}

/**
 * ErrorBoundary catches React component errors and displays a fallback UI
 * Prevents entire app from crashing when a single component throws an error
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `EB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTimestamp: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'Component';

    try {
      // Log error with full context
      console.error(`[${this.state.errorId}] ErrorBoundary caught error in ${componentName}:`, {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });

      this.setState({errorInfo});
    } catch (stateError) {
      // setState failed - log but don't throw to avoid cascading errors
      console.error('ErrorBoundary failed to update state:', stateError);
    }
  }

  handleReset = () => {
    const now = Date.now();
    const timeSinceLastError = this.state.lastErrorTimestamp
      ? now - this.state.lastErrorTimestamp
      : Infinity;

    // If errors are happening rapidly (within 5 seconds), increment counter
    const newErrorCount = timeSinceLastError < 5000
      ? this.state.errorCount + 1
      : 0;

    if (newErrorCount >= 3) {
      // Too many rapid errors - permanent failure
      console.error('ErrorBoundary: Too many rapid errors, preventing infinite loop');
      return;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorCount: newErrorCount,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      try {
        return (
          <ErrorFallback
            error={this.state.error}
            errorId={this.state.errorId}
            errorCount={this.state.errorCount}
            onReset={this.handleReset}
          />
        );
      } catch (fallbackError) {
        // Last-resort minimal fallback if ErrorFallback itself crashes
        console.error('ErrorFallback itself crashed:', fallbackError);
        return (
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20}}>
            <Text style={{color: '#cf222e', fontSize: 16, textAlign: 'center', marginBottom: 10}}>
              Critical Error
            </Text>
            <Text style={{color: '#333', fontSize: 14, textAlign: 'center'}}>
              The error recovery system encountered an error.{'\n'}
              Please restart the application.
            </Text>
          </View>
        );
      }
    }

    return this.props.children;
  }
}

/**
 * Sanitizes error message to remove sensitive information
 */
function sanitizeErrorMessage(error?: Error): string {
  if (!error?.message) {
    return 'An unexpected error occurred';
  }

  let message = error.message;

  // Remove file paths
  message = message.replace(/\/[\w\/\-_.]+/g, '[path]');

  // Remove potential tokens/keys (long alphanumeric strings)
  message = message.replace(/[a-zA-Z0-9]{32,}/g, '[redacted]');

  // Limit length to prevent UI overflow
  if (message.length > 200) {
    message = message.substring(0, 197) + '...';
  }

  return message;
}

/**
 * Default fallback UI shown when error boundary catches an error
 */
function ErrorFallback({
  error,
  errorId,
  errorCount,
  onReset,
}: {
  error?: Error;
  errorId?: string;
  errorCount: number;
  onReset: () => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const colors = {
    bg: isDark ? '#1e1e1e' : '#ffffff',
    fg: isDark ? '#cccccc' : '#333333',
    muted: isDark ? '#858585' : '#6c6c6c',
    border: isDark ? '#3e3e3e' : '#e5e5e5',
    danger: isDark ? '#f85149' : '#cf222e',
    buttonBg: isDark ? '#238636' : '#2da44e',
    buttonText: '#ffffff',
    buttonPressed: isDark ? '#2c974b' : '#2ea043',
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.bg}]}>
      <View
        style={[
          styles.errorBox,
          {
            backgroundColor: isDark ? '#2d2d30' : '#f8f8f8',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, {color: colors.danger}]}>
          Something went wrong
        </Text>

        <Text style={[styles.message, {color: colors.fg}]}>
          {sanitizeErrorMessage(error)}
        </Text>

        {errorId && (
          <Text style={[styles.errorId, {color: colors.muted}]}>
            Error ID: {errorId}
          </Text>
        )}

        <Text style={[styles.hint, {color: colors.muted}]}>
          {errorCount >= 2
            ? 'This component is experiencing repeated errors. Please restart the app.'
            : 'This error has been logged. Try resetting this component or restart the app if the issue persists.'}
        </Text>

        {errorCount < 3 ? (
          <TouchableOpacity
            onPress={onReset}
            style={[
              styles.button,
              {backgroundColor: colors.buttonBg},
            ]}
          >
            <Text style={[styles.buttonText, {color: colors.buttonText}]}>
              Try Again
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.permanentError, {color: colors.danger}]}>
            Component recovery failed. Please restart the app.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorBox: {
    maxWidth: 400,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Menlo, monospace',
    lineHeight: 20,
  },
  errorId: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Menlo, monospace',
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  permanentError: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
});

export default ErrorBoundary;
