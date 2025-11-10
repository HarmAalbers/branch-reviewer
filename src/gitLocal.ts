// Real local Git integration for macOS RN via NativeModules.
// Uses a tiny Objective‑C module (BRGit) embedded in AppDelegate.mm that shells out to `git`.
// If the native module is unavailable, we return empty data to avoid showing dummy content.

import { NativeModules } from 'react-native';

export type ScanResult = {
  branches: { name: string; isCurrent?: boolean }[];
  currentBranch: string;
  baseBranch: string;
  branchFiles: Record<
    string,
    { path: string; additions: number; deletions: number; patch: string[] }[]
  >;
  branchCommits: Record<
    string,
    { hash: string; author: string; message: string; dateISO: string }[]
  >;
};

const BRGit: { scanRepo?: (path: string) => Promise<ScanResult> } =
  NativeModules.BRGit ?? {};

export async function scanRepo(path: string): Promise<ScanResult> {
  if (typeof BRGit.scanRepo === 'function') {
    try {
      const res = await BRGit.scanRepo(path);
      // Basic validation to ensure shape is as expected
      if (res && Array.isArray(res.branches)) {
        return res;
      }
    } catch (e) {
      console.warn('scanRepo failed', e);
    }
  } else {
    console.warn('BRGit native module not available; returning empty Git data');
  }
  return {
    branches: [],
    currentBranch: '',
    baseBranch: 'main',
    branchFiles: {},
    branchCommits: {},
  };
}
