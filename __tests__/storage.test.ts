/**
 * @format
 */

import {Settings} from 'react-native';
import {loadState, saveState, type PersistedState} from '../src/storage';

// Settings is already mocked in setup.ts
const mockSettings = Settings as jest.Mocked<typeof Settings>;

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadState', () => {
    it('returns undefined when no saved state exists', () => {
      mockSettings.get.mockReturnValue(undefined);

      const result = loadState();

      expect(result).toBeUndefined();
      expect(mockSettings.get).toHaveBeenCalledWith('branchReviewer.appState.v1');
    });

    it('returns undefined when saved state is empty string', () => {
      mockSettings.get.mockReturnValue('');

      const result = loadState();

      expect(result).toBeUndefined();
    });

    it('parses and returns valid persisted state', () => {
      const mockState: PersistedState = {
        repos: [
          {
            id: 'repo-1',
            name: 'test-repo',
            path: '/path/to/repo',
            branches: [{name: 'main', isCurrent: true}],
          },
        ],
        selectedRepoId: 'repo-1',
        selectedBranchName: 'main',
        collapsed: {'repo-1': false},
      };

      mockSettings.get.mockReturnValue(JSON.stringify(mockState));

      const result = loadState();

      expect(result).toEqual(mockState);
    });

    it('returns undefined and logs warning when JSON is invalid', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSettings.get.mockReturnValue('{ invalid json }');

      const result = loadState();

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load persisted state',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('handles Settings.get throwing an error', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSettings.get.mockImplementation(() => {
        throw new Error('Settings API error');
      });

      const result = loadState();

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load persisted state',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('handles circular reference data gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Mock JSON that would create circular ref if parsed
      mockSettings.get.mockReturnValue('{"a": {"b": {"c": {"ref": "[Circular]"}}}}');

      const result = loadState();

      // Should successfully parse this (it's valid JSON, just represents circular data)
      expect(result).toBeDefined();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveState', () => {
    it('serializes and saves state to Settings', () => {
      const state: PersistedState = {
        repos: [{id: 'r1', name: 'repo', path: '/path'}],
        selectedRepoId: 'r1',
        selectedBranchName: 'main',
        collapsed: {'r1': false},
      };

      saveState(state);

      expect(mockSettings.set).toHaveBeenCalledWith({
        'branchReviewer.appState.v1': JSON.stringify(state),
      });
      expect(mockSettings.set).toHaveBeenCalledTimes(1);
    });

    it('saves empty repos array', () => {
      const state: PersistedState = {
        repos: [],
      };

      saveState(state);

      expect(mockSettings.set).toHaveBeenCalledWith({
        'branchReviewer.appState.v1': '{"repos":[]}',
      });
    });

    it('saves state with minimal fields', () => {
      const state: PersistedState = {
        repos: [],
      };

      saveState(state);

      const savedValue = (mockSettings.set as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(savedValue['branchReviewer.appState.v1']);

      expect(parsed).toEqual({repos: []});
    });

    it('handles Settings.set throwing an error', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSettings.set.mockImplementation(() => {
        throw new Error('NSUserDefaults quota exceeded');
      });

      const state: PersistedState = {repos: []};

      // Should not throw (error is swallowed)
      expect(() => saveState(state)).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to save state',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('round-trip persistence', () => {
    it('can save and load state without data loss', () => {
      const originalState: PersistedState = {
        repos: [
          {
            id: 'repo-1',
            name: 'my-project',
            path: '/Users/test/projects/my-project',
            branches: [
              {name: 'main', isCurrent: true},
              {name: 'feature-auth'},
            ],
            pullRequests: [],
            baseBranch: 'main',
            currentBranch: 'main',
            branchCommits: {},
            branchFiles: {},
          },
        ],
        selectedRepoId: 'repo-1',
        selectedBranchName: 'feature-auth',
        collapsed: {'repo-1': false},
      };

      // Save state
      saveState(originalState);

      // Simulate loading it back
      const savedJSON = (mockSettings.set as jest.Mock).mock.calls[0][0]['branchReviewer.appState.v1'];
      mockSettings.get.mockReturnValue(savedJSON);

      // Load state
      const loadedState = loadState();

      expect(loadedState).toEqual(originalState);
    });

    it('handles state with special characters in repo names', () => {
      const state: PersistedState = {
        repos: [
          {
            id: 'r1',
            name: 'Project with "quotes" & <symbols>',
            path: '/path/to/repo',
          },
        ],
      };

      saveState(state);

      const savedJSON = (mockSettings.set as jest.Mock).mock.calls[0][0]['branchReviewer.appState.v1'];
      mockSettings.get.mockReturnValue(savedJSON);

      const result = loadState();

      expect(result?.repos[0].name).toBe('Project with "quotes" & <symbols>');
    });
  });
});
