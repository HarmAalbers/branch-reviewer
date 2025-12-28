import {useMemo} from 'react';
import {useColorScheme} from 'react-native';

export type ThemeColors = {
  // Window/container backgrounds
  windowBg: string;
  bg: string;
  contentBg: string;

  // Text colors
  fg: string;
  muted: string;

  // UI elements
  border: string;
  selected: string;
  rowPressed: string;

  // Code syntax colors
  code: string;
  codeBg: string;
  add: string;
  del: string;

  // Comment/thread colors
  commentIndicatorBg: string;
  threadBg: string;
  resolvedBorder: string;
  resolvedBadgeBg: string;
  resolvedText: string;

  // Interactive elements
  link: string;
  danger: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonBg: string;
  buttonPressed: string;
  buttonPrimaryPressed: string;
  inputBg: string;
  placeholder: string;

  // Additional UI states
  currentDot: string;
};

/**
 * Default fallback colors (safe minimal palette)
 */
function getDefaultColors(isDark: boolean): ThemeColors {
  return {
    windowBg: isDark ? '#1e1e1e' : '#ffffff',
    bg: isDark ? '#1e1e1e' : '#ffffff',
    contentBg: isDark ? '#252526' : '#f8f8f8',
    fg: isDark ? '#cccccc' : '#333333',
    muted: isDark ? '#858585' : '#6c6c6c',
    border: isDark ? '#3e3e3e' : '#e5e5e5',
    selected: isDark ? '#37373d' : '#e8e8e8',
    rowPressed: isDark ? '#2a2d2e' : '#e0e0e0',
    code: isDark ? '#d4d4d4' : '#1e1e1e',
    codeBg: isDark ? '#161b22' : '#f6f8fa',
    add: isDark ? '#4ec9b0' : '#098658',
    del: isDark ? '#f48771' : '#a31515',
    commentIndicatorBg: isDark ? '#2d2d3050' : '#f6f8fa50',
    threadBg: isDark ? '#2d2d30' : '#f6f8fa',
    resolvedBorder: isDark ? '#2ea043' : '#1a7f37',
    resolvedBadgeBg: isDark ? '#2ea04333' : '#dafbe1',
    resolvedText: isDark ? '#3fb950' : '#1a7f37',
    link: isDark ? '#58a6ff' : '#0969da',
    danger: isDark ? '#f85149' : '#cf222e',
    buttonPrimary: isDark ? '#238636' : '#2da44e',
    buttonSecondary: isDark ? '#3e3e3e' : '#f6f8fa',
    buttonBg: isDark ? '#161b22' : '#f6f8fa',
    buttonPressed: isDark ? '#0d1117' : '#eaeef2',
    buttonPrimaryPressed: '#2c974b',
    inputBg: isDark ? '#1e1e1e' : '#ffffff',
    placeholder: isDark ? '#8b949e' : '#6e7781',
    currentDot: isDark ? '#4fc1ff' : '#007acc',
  };
}

/**
 * useTheme hook provides consistent theming across the application
 * Consolidates all getColors() functions into a single source of truth
 */
export function useTheme(): {isDark: boolean; colors: ThemeColors} {
  const colorScheme = useColorScheme();
  // Handle null/undefined from useColorScheme (platform-specific behavior)
  const isDark = colorScheme === 'dark';

  const colors = useMemo((): ThemeColors => {
    try {
    if (isDark) {
      return {
        // Window/container backgrounds
        windowBg: '#1e1e1e',
        bg: '#1e1e1e',
        contentBg: '#252526',

        // Text colors
        fg: '#cccccc',
        muted: '#858585',

        // UI elements
        border: '#3e3e3e',
        selected: '#37373d',
        rowPressed: '#2a2d2e',

        // Code syntax colors
        code: '#d4d4d4',
        codeBg: '#161b22',
        add: '#4ec9b0',
        del: '#f48771',

        // Comment/thread colors
        commentIndicatorBg: '#2d2d3050',
        threadBg: '#2d2d30',
        resolvedBorder: '#2ea043',
        resolvedBadgeBg: '#2ea04333',
        resolvedText: '#3fb950',

        // Interactive elements
        link: '#58a6ff',
        danger: '#f85149',
        buttonPrimary: '#238636',
        buttonSecondary: '#3e3e3e',
        buttonBg: '#161b22',
        buttonPressed: '#0d1117',
        buttonPrimaryPressed: '#2c974b',
        inputBg: '#1e1e1e',
        placeholder: '#8b949e',

        // Additional UI states
        currentDot: '#4fc1ff',
      };
    } else {
      return {
        // Window/container backgrounds
        windowBg: '#f5f5f5',
        bg: '#ffffff',
        contentBg: '#f8f8f8',

        // Text colors
        fg: '#333333',
        muted: '#6c6c6c',

        // UI elements
        border: '#e5e5e5',
        selected: '#e8e8e8',
        rowPressed: '#e0e0e0',

        // Code syntax colors
        code: '#1e1e1e',
        codeBg: '#f6f8fa',
        add: '#098658',
        del: '#a31515',

        // Comment/thread colors
        commentIndicatorBg: '#f6f8fa50',
        threadBg: '#f6f8fa',
        resolvedBorder: '#1a7f37',
        resolvedBadgeBg: '#dafbe1',
        resolvedText: '#1a7f37',

        // Interactive elements
        link: '#0969da',
        danger: '#cf222e',
        buttonPrimary: '#2da44e',
        buttonSecondary: '#f6f8fa',
        buttonBg: '#f6f8fa',
        buttonPressed: '#eaeef2',
        buttonPrimaryPressed: '#2c974b',
        inputBg: '#ffffff',
        placeholder: '#6e7781',

        // Additional UI states
        currentDot: '#007acc',
      };
    }
    } catch (error) {
      // If color creation fails, log and return safe defaults
      console.error('Theme color creation failed:', error);
      return getDefaultColors(isDark);
    }
  }, [isDark]);

  return {isDark, colors};
}
