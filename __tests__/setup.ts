/**
 * Jest setup file for mocking native modules
 * This file is loaded before all tests to configure the test environment
 */

// Mock BRGit native module (our custom native module)
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  // BRGit mocks require explicit configuration in tests
  // This prevents silent failures from undefined returns
  RN.NativeModules.BRGit = {
    scanRepo: jest.fn(() =>
      Promise.reject(
        new Error(
          'BRGit.scanRepo must be mocked in test with .mockResolvedValue()'
        )
      )
    ),
    scanBranch: jest.fn(() =>
      Promise.reject(
        new Error(
          'BRGit.scanBranch must be mocked in test with .mockResolvedValue()'
        )
      )
    ),
    pickFolder: jest.fn(() =>
      Promise.reject(
        new Error(
          'BRGit.pickFolder must be mocked in test with .mockResolvedValue()'
        )
      )
    ),
  };

  RN.NativeModules.SettingsManager = {
    settings: {},
    setValues: jest.fn(),
  };

  // Settings API mock - part of RN.Settings (not just NativeModules)
  RN.Settings = {
    get: jest.fn(() => undefined),
    set: jest.fn(),
  };

  RN.Platform.OS = 'macos';

  return RN;
});

// Mock useColorScheme hook
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
}));

// Mock Settings API
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));
