import { Settings } from 'react-native';

// Keys used in Settings (NSUserDefaults on macOS)
const KEY = 'branchReviewer.appState.v1';

export type PersistedState = {
  repos: any; // We intentionally store as any (plain JSON) to avoid versioning pains
  selectedRepoId?: string;
  selectedPrId?: string;
  selectedBranchName?: string;
  collapsed?: Record<string, boolean>;
};

export function loadState(): PersistedState | undefined {
  try {
    const raw = Settings.get(KEY) as string | undefined;
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedState;
    return parsed;
  } catch (e) {
    console.warn('Failed to load persisted state', e);
    return undefined;
  }
}

export function saveState(state: PersistedState) {
  try {
    Settings.set({ [KEY]: JSON.stringify(state) });
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}
