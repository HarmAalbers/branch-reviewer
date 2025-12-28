/**
 * @format
 */

import {NativeModules} from 'react-native';
import {pickFolder, scanBranch, scanRepo} from '../src/gitLocal';
import type {ScanResult} from '../src/gitLocal';

// Get reference to mocked BRGit module
const BRGit = NativeModules.BRGit;

describe('gitLocal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pickFolder', () => {
    it('returns path when user selects folder', async () => {
      (BRGit.pickFolder as jest.Mock).mockResolvedValue('/Users/test/repo');

      const result = await pickFolder();

      expect(result).toBe('/Users/test/repo');
      expect(BRGit.pickFolder).toHaveBeenCalledTimes(1);
    });

    it('returns null when user cancels', async () => {
      const cancelError = {code: 'ECANCELLED', message: 'User cancelled'};
      (BRGit.pickFolder as jest.Mock).mockRejectedValue(cancelError);

      const result = await pickFolder();

      expect(result).toBeNull();
    });

    it('throws error for non-cancellation errors', async () => {
      const error = new Error('Permission denied');
      (BRGit.pickFolder as jest.Mock).mockRejectedValue(error);

      await expect(pickFolder()).rejects.toThrow('Permission denied');
    });

    it('throws error when BRGit module not available', async () => {
      // Simulate missing native module
      const originalPickFolder = BRGit.pickFolder;
      delete BRGit.pickFolder;

      await expect(pickFolder()).rejects.toThrow(
        'BRGit native module not available'
      );

      // Restore
      BRGit.pickFolder = originalPickFolder;
    });
  });

  describe('scanBranch', () => {
    const mockBranchData = {
      commits: [
        {
          hash: 'abc123',
          author: 'John Doe',
          message: 'Test commit',
          dateISO: '2025-12-28T10:00:00Z',
        },
      ],
      files: [
        {
          path: 'test.ts',
          additions: 5,
          deletions: 2,
          patch: ['+  const foo = 1;', '-  const bar = 2;'],
        },
      ],
    };

    it('returns branch data successfully', async () => {
      (BRGit.scanBranch as jest.Mock).mockResolvedValue(mockBranchData);

      const result = await scanBranch('/repo/path', 'feature', 'main');

      expect(result).toEqual(mockBranchData);
      expect(BRGit.scanBranch).toHaveBeenCalledWith('/repo/path', 'feature', 'main');
    });

    it('throws error when native module fails', async () => {
      const error = new Error('git command failed');
      (BRGit.scanBranch as jest.Mock).mockRejectedValue(error);

      await expect(
        scanBranch('/repo/path', 'feature', 'main')
      ).rejects.toThrow('Failed to scan branch "feature"');
    });

    it('throws error when BRGit module not available', async () => {
      const originalScanBranch = BRGit.scanBranch;
      delete BRGit.scanBranch;

      await expect(
        scanBranch('/repo/path', 'feature', 'main')
      ).rejects.toThrow('BRGit native module not available');

      // Restore
      BRGit.scanBranch = originalScanBranch;
    });

    it('includes context in error message', async () => {
      (BRGit.scanBranch as jest.Mock).mockRejectedValue(new Error('not a git repository'));

      await expect(
        scanBranch('/invalid/path', 'develop', 'master')
      ).rejects.toThrow('Failed to scan branch "develop"');
    });
  });

  describe('scanRepo', () => {
    const mockRepoData: ScanResult = {
      branches: [{name: 'main', isCurrent: true}, {name: 'develop'}],
      currentBranch: 'main',
      baseBranch: 'main',
      branchCommits: {
        main: [{hash: 'abc', author: 'Test', message: 'Init', dateISO: '2025-12-28T10:00:00Z'}],
      },
      branchFiles: {
        main: [{path: 'README.md', additions: 10, deletions: 0, patch: []}],
      },
    };

    it('returns repo data successfully', async () => {
      (BRGit.scanRepo as jest.Mock).mockResolvedValue(mockRepoData);

      const result = await scanRepo('/repo/path');

      expect(result).toEqual(mockRepoData);
      expect(BRGit.scanRepo).toHaveBeenCalledWith('/repo/path');
    });

    it('calls onProgress callback with status messages', async () => {
      (BRGit.scanRepo as jest.Mock).mockResolvedValue(mockRepoData);
      const onProgress = jest.fn();

      await scanRepo('/repo/path', onProgress);

      expect(onProgress).toHaveBeenCalledWith('Step 2/6: Checking git repository...');
      expect(onProgress).toHaveBeenCalledWith('Step 3/6: Loading branches...');
      expect(onProgress).toHaveBeenCalledWith('Step 4/6: Processing branch data...');
      expect(onProgress).toHaveBeenCalledWith('Step 5/6: Found 2 branches');
      expect(onProgress).toHaveBeenCalledWith('Step 6/6: Loading current branch details...');
      expect(onProgress).toHaveBeenCalledTimes(5);
    });

    it('works without onProgress callback', async () => {
      (BRGit.scanRepo as jest.Mock).mockResolvedValue(mockRepoData);

      const result = await scanRepo('/repo/path');

      expect(result).toEqual(mockRepoData);
    });

    it('throws error when native module fails', async () => {
      const error = new Error('not a git repository');
      (BRGit.scanRepo as jest.Mock).mockRejectedValue(error);

      await expect(scanRepo('/invalid/path')).rejects.toThrow('not a git repository');
    });

    it('throws error when BRGit module not available', async () => {
      const originalScanRepo = BRGit.scanRepo;
      delete BRGit.scanRepo;

      await expect(scanRepo('/repo/path')).rejects.toThrow(
        'BRGit native module not available'
      );

      // Restore
      BRGit.scanRepo = originalScanRepo;
    });

    it('throws error when native module returns invalid data', async () => {
      (BRGit.scanRepo as jest.Mock).mockResolvedValue({branches: 'not-an-array'});

      await expect(scanRepo('/repo/path')).rejects.toThrow(
        'Invalid response from native module: missing branches array'
      );
    });

    it('throws error when native module returns null', async () => {
      (BRGit.scanRepo as jest.Mock).mockResolvedValue(null);

      await expect(scanRepo('/repo/path')).rejects.toThrow(
        'Invalid response from native module: missing branches array'
      );
    });
  });
});
