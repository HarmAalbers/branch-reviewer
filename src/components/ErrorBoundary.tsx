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
}

/**
 * ErrorBoundary catches React component errors and displays a fallback UI
 * Prevents entire app from crashing when a single component throws an error
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'Component';
    console.error(`ErrorBoundary caught error in ${componentName}:`, error, errorInfo);

    this.setState({errorInfo});
  }

  handleReset = () => {
    this.setState({hasError: false, error: undefined, errorInfo: undefined});
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default fallback UI shown when error boundary catches an error
 */
function ErrorFallback({
  error,
  onReset,
}: {
  error?: Error;
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

        {error?.message && (
          <Text style={[styles.message, {color: colors.fg}]}>
            {error.message}
          </Text>
        )}

        <Text style={[styles.hint, {color: colors.muted}]}>
          This error has been logged. Try resetting this component or restarting the app.
        </Text>

        <TouchableOpacity
          onPress={onReset}
          style={({pressed}) => [
            styles.button,
            {
              backgroundColor: pressed ? colors.buttonPressed : colors.buttonBg,
            },
          ]}
        >
          <Text style={[styles.buttonText, {color: colors.buttonText}]}>
            Try Again
          </Text>
        </TouchableOpacity>
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
});

export default ErrorBoundary;
