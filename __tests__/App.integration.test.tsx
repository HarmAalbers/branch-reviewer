/**
 * @format
 * Integration tests for App.tsx state management
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {NativeModules, Settings} from 'react-native';
import App from '../App';

const BRGit = NativeModules.BRGit;

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Settings mock to empty state
    (Settings.get as jest.Mock).mockReturnValue(undefined);
  });

  describe('Initial render', () => {
    it('renders main layout with sidebar', () => {
      const {getByText} = render(<App />);

      expect(getByText('Repositories')).toBeTruthy();
      expect(getByText('+')).toBeTruthy();
    });

    it('shows empty state when no repos loaded', () => {
      const {getByText} = render(<App />);

      expect(getByText('Select a branch to view details')).toBeTruthy();
    });
  });

  describe('Repository management', () => {
    it('can add a repository successfully', async () => {
      (BRGit.pickFolder as jest.Mock).mockResolvedValue('/Users/test/my-repo');
      (BRGit.scanRepo as jest.Mock).mockResolvedValue({
        branches: [{name: 'main', isCurrent: true}],
        currentBranch: 'main',
        baseBranch: 'main',
        branchCommits: {
          main: [{hash: 'abc', author: 'Test', message: 'Init', dateISO: '2025-12-28T10:00:00Z'}],
        },
        branchFiles: {
          main: [{path: 'README.md', additions: 1, deletions: 0, patch: ['+  # Hello']}],
        },
      });

      const {getByText} = render(<App />);

      // Click "+" button to add repo
      fireEvent.press(getByText('+'));

      // Wait for repo to be added
      await waitFor(() => {
        expect(getByText('my-repo')).toBeTruthy();
      });

      expect(BRGit.pickFolder).toHaveBeenCalledTimes(1);
      expect(BRGit.scanRepo).toHaveBeenCalledWith('/Users/test/my-repo');
    });

    it('handles user cancelling folder picker', async () => {
      const cancelError = {code: 'ECANCELLED', message: 'User cancelled'};
      (BRGit.pickFolder as jest.Mock).mockRejectedValue(cancelError);

      const {getByText, queryByText} = render(<App />);

      fireEvent.press(getByText('+'));

      await waitFor(() => {
        expect(BRGit.pickFolder).toHaveBeenCalledTimes(1);
      });

      // No repo should be added
      expect(queryByText('my-repo')).toBeNull();
    });
  });

  describe('Branch selection', () => {
    it('can select a branch', async () => {
      // Setup initial repo
      (Settings.get as jest.Mock).mockReturnValue(
        JSON.stringify({
          repos: [
            {
              id: 'r1',
              name: 'test-repo',
              path: '/path/to/repo',
              branches: [{name: 'main', isCurrent: true}, {name: 'feature'}],
              pullRequests: [],
              baseBranch: 'main',
              currentBranch: 'main',
              branchCommits: {
                main: [{hash: 'abc', author: 'Test', message: 'Init', dateISO: '2025-12-28T10:00:00Z'}],
              },
              branchFiles: {
                main: [{path: 'README.md', additions: 1, deletions: 0, patch: []}],
              },
            },
          ],
          selectedRepoId: 'r1',
          selectedBranchName: 'main',
          collapsed: {},
        })
      );

      (BRGit.scanBranch as jest.Mock).mockResolvedValue({
        commits: [{hash: 'def', author: 'Dev', message: 'Feature', dateISO: '2025-12-28T11:00:00Z'}],
        files: [{path: 'src/feature.ts', additions: 50, deletions: 5, patch: ['+  new code']}],
      });

      const {getByText} = render(<App />);

      // App should load persisted state
      await waitFor(() => {
        expect(getByText('test-repo')).toBeTruthy();
      });

      // Click feature branch
      fireEvent.press(getByText('feature'));

      // Wait for branch data to load
      await waitFor(() => {
        expect(BRGit.scanBranch).toHaveBeenCalledWith('/path/to/repo', 'feature', 'main');
      });
    });
  });

  describe('State persistence', () => {
    it('calls Settings.set when repos change', async () => {
      (BRGit.pickFolder as jest.Mock).mockResolvedValue('/Users/test/my-project');
      (BRGit.scanRepo as jest.Mock).mockResolvedValue({
        branches: [{name: 'main', isCurrent: true}],
        currentBranch: 'main',
        baseBranch: 'main',
        branchCommits: {
          main: [],
        },
        branchFiles: {
          main: [],
        },
      });

      const {getByText} = render(<App />);

      fireEvent.press(getByText('+'));

      // Verify Settings.set was called to persist state
      await waitFor(() => {
        expect(Settings.set).toHaveBeenCalled();
      }, {timeout: 3000});

      // Verify the correct key was used
      const savedCalls = (Settings.set as jest.Mock).mock.calls;
      expect(savedCalls.length).toBeGreaterThan(0);

      const lastSavedState = savedCalls[savedCalls.length - 1][0];
      expect(Object.keys(lastSavedState)).toContain('branchReviewer.appState.v1');
    });
  });

  describe('Collapsed state', () => {
    it('toggles repo collapse state', async () => {
      (Settings.get as jest.Mock).mockReturnValue(
        JSON.stringify({
          repos: [
            {
              id: 'r1',
              name: 'test-repo',
              path: '/path',
              branches: [{name: 'main', isCurrent: true}],
              pullRequests: [],
              baseBranch: 'main',
              currentBranch: 'main',
              branchCommits: {},
              branchFiles: {},
            },
          ],
          selectedRepoId: 'r1',
          collapsed: {},
        })
      );

      const {getByText, queryByText} = render(<App />);

      // Wait for repo to load
      await waitFor(() => {
        expect(getByText('test-repo')).toBeTruthy();
      });

      // Initially expanded, should see branches
      expect(getByText('main')).toBeTruthy();

      // Click repo to toggle collapse
      fireEvent.press(getByText('test-repo'));

      // Branches should be hidden
      await waitFor(() => {
        expect(queryByText('main')).toBeNull();
      });
    });
  });
});
