# ADR-003: NSUserDefaults for State Persistence

## Status
Approved

## Context
Application state (repositories, selected branches, UI collapsed state, inline review comments) needs to persist across app restarts. Options include SQLite, Realm, file-based JSON storage, or NSUserDefaults. A database adds significant dependency overhead and complexity for simple key-value state. File-based storage requires manual path management and error handling. NSUserDefaults is the macOS-native solution for user preferences with automatic synchronization and backup.

## Decision
Use React Native `Settings` API (which wraps NSUserDefaults on macOS) with a single JSON-serialized key `branchReviewer.appState.v1` for all application state. Store the entire state object as a JSON string, loaded on app launch and saved on every state change.

## Allowed
- **React Native Settings API** (`react-native Settings` module)
- **Single persistence key**: `branchReviewer.appState.v1`
- **JSON serialization** of entire application state
- **Versioned key name** (`.v1` suffix allows future schema changes)
- **Migration logic** to handle:
  - Stale demo data (repos with ids like `r1`, `r2` and no path)
  - Old schema versions when upgrading
  - Corrupted or invalid JSON
- **Stored state includes**:
  - `repos: Repo[]` - Repository data, branches, commits, files, comments
  - `selectedRepoId?: string` - Currently selected repository
  - `selectedPrId?: string` - Currently selected PR (currently unused)
  - `selectedBranchName?: string` - Currently selected branch
  - `collapsed: Record<string, boolean>` - UI collapsed sections
- **Automatic save on state change** (triggered by App.tsx useState setter)
- **All persistence logic in `src/storage.ts`** module

## Prohibited
- **SQLite or other database libraries** (e.g., Realm, WatermelonDB)
- **Multiple NSUserDefaults keys** for different state slices (use single JSON key)
- **File-based persistence** (JSON files, .plist files in Documents folder)
- **Cloud sync** (iCloud NSUbiquitousKeyValueStore, remote APIs)
- **State encryption** (for now - may be added in future ADR if needed)
- **Direct Settings.set/get calls** outside of `src/storage.ts` module
- **Storing large binary data** in NSUserDefaults (use file system for images, etc.)
- **Separate persistence keys for UI state vs app state**

## Consequences

### Positive
- **Zero dependencies**: No database library or file management code
- **macOS-native**: Uses platform-standard NSUserDefaults
- **Automatic backup**: NSUserDefaults included in Time Machine backups
- **Simple API**: Two functions - `loadState()` and `saveState()`
- **Easy inspection**: Can view with `defaults read com.example.branchreviewer`
- **Atomic updates**: NSUserDefaults handles concurrent access
- **Migration-friendly**: Versioned key allows future schema changes

### Negative
- **NSUserDefaults size limits**: Recommended max ~1MB, large repos may hit limits
- **No structured queries**: Must deserialize entire state to query
- **No transactions**: Can't rollback partial state changes
- **Manual schema versioning**: Must write migration code for schema changes
- **Slower for large data**: JSON parse/stringify on every save/load
- **No relational queries**: Can't join or index data efficiently

## Enforcement

### Code Review
- **BLOCKING**: New storage mechanisms (SQLite, files, etc.) must be rejected
- **BLOCKING**: Direct `Settings.set/get` calls outside `src/storage.ts`
- All persistence must go through `src/storage.ts` module
- Verify state shape matches TypeScript `PersistedState` interface
- Check that saved state doesn't include sensitive data (passwords, tokens)

### Module Boundaries
- `src/storage.ts` is the **only** module that imports `Settings` from `react-native`
- `App.tsx` calls `loadState()` on mount, `saveState(state)` on change
- No components should directly access `Settings` API

### Data Size Monitoring
- Monitor NSUserDefaults size in production (if analytics added)
- Warn users if repos array exceeds reasonable size (~50 repos)
- Consider lazy-loading file diffs to reduce state footprint

### Migration Testing
- Test migration from empty state (new install)
- Test migration from stale demo data (bundled repos)
- Test migration from future schema versions (forward compatibility)

### Documentation
- `src/storage.ts` documents state schema and migration logic
- CLAUDE.md explains NSUserDefaults persistence strategy
- TypeScript `PersistedState` type enforces schema at compile time
