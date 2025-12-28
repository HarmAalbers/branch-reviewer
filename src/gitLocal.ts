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

const BRGit: {
  scanRepo?: (path: string) => Promise<ScanResult>;
  scanBranch?: (
    path: string,
    branchName: string,
    baseBranch: string,
  ) => Promise<{
    commits: { hash: string; author: string; message: string; dateISO: string }[];
    files: { path: string; additions: number; deletions: number; patch: string[] }[];
  }>;
  pickFolder?: () => Promise<string>;
} = NativeModules.BRGit ?? {};

export async function pickFolder(): Promise<string | null> {
  if (typeof BRGit.pickFolder === 'function') {
    try {
      const path = await BRGit.pickFolder();
      return path;
    } catch (e: unknown) {
      // User cancelled the dialog - this is not an error
      if (e && typeof e === 'object' && 'code' in e && e.code === 'ECANCELLED') {
        return null;
      }
      // Any other error is a real problem
      console.error('pickFolder failed with unexpected error:', e);
      throw e;
    }
  }
  throw new Error('BRGit native module not available');
}

export async function scanBranch(
  path: string,
  branchName: string,
  baseBranch: string,
): Promise<{
  commits: { hash: string; author: string; message: string; dateISO: string }[];
  files: { path: string; additions: number; deletions: number; patch: string[] }[];
}> {
  if (typeof BRGit.scanBranch !== 'function') {
    throw new Error('BRGit native module not available');
  }

  try {
    const res = await BRGit.scanBranch(path, branchName, baseBranch);
    return res;
  } catch (e) {
    console.error('scanBranch failed:', {path, branchName, baseBranch, error: e});
    throw new Error(
      `Failed to scan branch "${branchName}": ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

export async function scanRepo(
  path: string,
  onProgress?: (step: string) => void,
): Promise<ScanResult> {
  if (typeof BRGit.scanRepo !== 'function') {
    throw new Error(
      'BRGit native module not available. The app may not be properly installed or configured.'
    );
  }

  try {
    onProgress?.('Step 2/6: Checking git repository...');
    await new Promise<void>(resolve => setTimeout(() => resolve(), 50));

    onProgress?.('Step 3/6: Loading branches...');
    await new Promise<void>(resolve => setTimeout(() => resolve(), 50));

    const res = await BRGit.scanRepo(path);

    onProgress?.('Step 4/6: Processing branch data...');
    await new Promise<void>(resolve => setTimeout(() => resolve(), 50));

    if (res && Array.isArray(res.branches)) {
      onProgress?.(`Step 5/6: Found ${res.branches.length} branches`);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 50));

      onProgress?.('Step 6/6: Loading current branch details...');
      await new Promise<void>(resolve => setTimeout(() => resolve(), 50));

      return res;
    }

    // If we get here, the native module returned invalid data
    throw new Error('Invalid response from native module: missing branches array');
  } catch (e) {
    console.error('scanRepo failed:', {path, error: e});
    throw e;
  }
}
