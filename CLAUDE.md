# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Branch Reviewer is a macOS-only React Native application (React Native macOS 0.78) that allows users to review Git branches locally. It displays commits, changed files, and diffs for local Git repositories without uploading anything to remote servers.

**Target Platform:** macOS 15+ on Apple Silicon (arm64) only
**Bundle ID:** com.example.branchreviewer

## Build Commands

Uses `just` as the task runner. All commands can be run via npm scripts or `just` recipes.

### Development workflow

```bash
# Install dependencies
npm install
# or: just install

# Install CocoaPods for macOS (first time or after Podfile changes)
cd macos && pod install
# or: just pods

# Start Metro bundler (required for Debug builds)
npm start
# or: just start

# Run the macOS app (in a separate terminal while Metro is running)
npm run macos
# or: just macos

# Dev workflow command (installs deps, pods, starts Metro)
# Then run "just macos" in a separate terminal
just dev
```

### Testing and quality

```bash
# Run Jest tests
npm test
# or: just test

# Lint with ESLint
npm run lint
# or: just lint

# Type-check with TypeScript
npx tsc --noEmit
# or: just typecheck

# Format with Prettier
npx prettier --write .
# or: just fmt
```

### Building release

```bash
# Create a Release .app
just build-app
# or manually:
# xcodebuild -workspace macos/branchReviewer.xcworkspace \
#   -scheme branchReviewer-macOS -configuration Release -arch arm64 build

# Bundle JavaScript for offline use
npm run bundle:macos
# or: just bundle-macos

# Create unsigned DMG
just package-dmg
```

### Troubleshooting

```bash
# Reset Metro cache and Watchman
just clean-metro-cache

# Reseed Watchman watch for this project (fixes recrawl warnings)
just watchman-reseed

# Full clean and reinstall
just clean
```

## Architecture

### Component Structure

- **App.tsx**: Root component managing application state using modern React patterns (useReducer for comments, custom hooks). Handles persistence via NSUserDefaults using `src/storage.ts`.
- **src/components/Sidebar.tsx**: Displays list of repositories and branches. Wrapped in ErrorBoundary for crash protection. Uses React.memo() for performance.
- **src/components/BranchDetails.tsx**: Shows commits and file changes for a selected branch. Includes inline comment threading. Uses React.memo() with custom comparison.
- **src/components/ErrorBoundary.tsx**: Production-grade error boundary with error loop detection, error ID tracking, and message sanitization.
- **src/components/CommentThread.tsx**: Threaded comment UI for code review. Supports add/edit/delete/resolve operations.

### Data Flow

1. User adds a local Git repository path via "Open Local Repo" button
2. App.tsx calls `scanRepo(path)` from `src/gitLocal.ts`
3. gitLocal.ts invokes the native `BRGit` module (defined in `macos/branchReviewer-macOS/AppDelegate.mm`)
4. BRGit shells out to the `git` CLI to gather:
   - List of local branches (via `git branch --list`)
   - Current branch (via `git rev-parse --abbrev-ref HEAD`)
   - Base branch (via `git symbolic-ref refs/remotes/origin/HEAD` or fallback to main/master)
   - Commits per branch since base (via `git log base..branch`)
   - Changed files with diffs (via `git diff base..branch`)
5. Results are stored in app state and persisted to NSUserDefaults
6. UI components render the branch data, commits, and file patches

### Native Module: BRGit

Located in `macos/branchReviewer-macOS/AppDelegate.mm`. This is a lightweight Objective-C++ native module that:

- Exposes a single async method: `scanRepo(path: string) -> Promise<ScanResult>`
- Shells out to git CLI using NSTask (via `/usr/bin/env git`)
- Ensures Homebrew paths (`/opt/homebrew/bin`, `/usr/local/bin`) are in PATH
- Returns JSON with branches, commits, and file changes
- Validates paths are Git repositories before processing

**Important:** The git binary must be available on PATH. Homebrew installs it to `/opt/homebrew/bin/git` on Apple Silicon.

### State Management

**Modern React Patterns** (as of React 19 + RN 0.78):

- **Centralized State in App.tsx** (ADR-004):
  - `useState` for repos, selections, collapsed state
  - `useReducer` via commentsReducer for complex comment CRUD operations
  - Custom hooks: `useLoading` (loading state), `useTheme` (theme colors)

- **Comment Management** (`src/state/commentsReducer.ts`):
  - Pure reducer function handling ADD/EDIT/DELETE/TOGGLE_RESOLVE actions
  - Eliminates deeply nested state updates
  - 95.83% test coverage

- **Custom Hooks**:
  - `useLoading` (`src/hooks/useLoading.ts`): Consolidates isLoading + message pattern
  - `useTheme` (`src/hooks/useTheme.ts`): Centralized theme system with 45 color properties

- **Performance Optimizations** (ADR-006):
  - All callbacks wrapped with `useCallback`
  - Components wrapped with `React.memo()`
  - Theme colors memoized with `useMemo`

### State Persistence

- Uses `react-native Settings` API (wraps NSUserDefaults on macOS)
- Key: `branchReviewer.appState.v1`
- Persists: repos, selectedRepoId, selectedBranchName, collapsed state
- 100% test coverage on persistence layer

### Types

See `src/types.ts` for TypeScript definitions:

- `Repo`: Repository with id, name, path, branches, commits, files, reviewComments
- `Branch`: Branch name and current flag
- `Commit`: Hash, author, message, dateISO
- `FileChange`: Path, additions, deletions, patch lines
- `LineComments`: Inline code review comments on specific file lines
- `ReviewComment`: Individual comment with threading support (parentId)
- `ThemeColors`: Comprehensive type for theme system (45 color properties)

## Important Platform Notes

### macOS-only constraints

- Do not import `react-native-safe-area-context` directly; App.tsx conditionally imports it only on non-macOS platforms to avoid native module errors
- Uses `Platform.OS === 'macos'` checks for platform-specific code
- Android, iOS, and Electron targets have been removed

### Debug vs Release builds

- **Debug**: Requires Metro bundler running. Pre-bundled `macos/main.jsbundle` is ignored unless `USE_PREBUNDLED_DEBUG=1` is set.
- **Release**: Xcode build script automatically bundles JavaScript into the .app. Metro not required.
- If Metro shows "No bundle URL present" error, ensure Metro is running with `npm start`

### Watchman configuration

- `.watchmanconfig` ignores heavy directories: `.git`, `node_modules`, `macos/Pods`, `macos/build`, `.metro-cache`
- Prevents expensive recrawls that can trigger "MustScanSubDirs" or "UserDropped" warnings
- If recrawl warnings occur, run `just watchman-reseed` to reset the watch

## Testing

### Test Infrastructure

- **Framework**: Jest 30.2.0 + @testing-library/react-native 13.3.3
- **Coverage**: 79.49% overall (98 tests)
- **Coverage Thresholds**: 50% statements/functions/lines, 40% branches
- **Test Files**: `__tests__/` directory with component, integration, and unit tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test __tests__/components/Sidebar.test.tsx

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage by Module

- gitLocal.ts: 100%
- storage.ts: 100%
- Sidebar.tsx: 100%
- useLoading.ts: 100%
- commentsReducer.ts: 95.83%
- BranchDetails.tsx: 81.81%
- ErrorBoundary.tsx: 80.55%
- App.tsx: 75.25%

### Native Module Mocking

Tests use `__tests__/setup.ts` to mock:

- `BRGit` native module (scanRepo, scanBranch, pickFolder)
- `Settings` API (NSUserDefaults persistence)
- `Platform.OS` (always 'macos' in tests)
- `useColorScheme` hook (defaults to 'light')

## CI/CD and Automation

### GitHub Actions

**Workflows** (`.github/workflows/`):

1. **ci.yml**: Main CI pipeline
   - Jobs: lint, typecheck, test (with coverage), build
   - Runs on: All pushes and PRs
   - Uploads coverage to Codecov
   - Validates macOS app builds successfully

2. **dependency-review.yml**: Security scanning
   - Runs on: Pull requests to main
   - Blocks high/critical vulnerabilities
   - Reviews dependency changes

### Pre-commit Hooks

**Husky + lint-staged** (`.husky/pre-commit`):

- Auto-fixes ESLint errors on staged files
- Auto-formats with Prettier
- Runs TypeScript type checking
- **Blocks commits** if validation fails

```bash
# Install hooks (first time)
just hooks-install

# Or manually
npm install
npx husky init
```

**What happens on commit**:

1. lint-staged runs ESLint --fix on .ts/.tsx files
2. lint-staged runs Prettier on all staged files
3. TypeScript compilation check (npx tsc --noEmit)
4. Commit blocked if any step fails

## Prerequisites

- macOS 15 (Sequoia) on Apple Silicon
- Xcode 16+ with command line tools: `xcode-select --install`
- Node.js 20+
- CocoaPods: `sudo gem install cocoapods`
- Optional: Homebrew (`brew install node watchman just`)
- Git must be installed and on PATH (Homebrew: `brew install git`)

## Xcode Integration

- Workspace: `macos/branchReviewer.xcworkspace` (NOT the .xcodeproj)
- Scheme: `branchReviewer-macOS`
- Open workspace in Xcode to run, debug, or build from IDE
- Release builds are under `~/Library/Developer/Xcode/DerivedData/*/Build/Products/Release/branchReviewer.app`
