# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Branch Reviewer is a macOS-only React Native application (React Native macOS 0.73) that allows users to review Git branches locally. It displays commits, changed files, and diffs for local Git repositories without uploading anything to remote servers.

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

- **App.tsx**: Root component managing application state (repos, selections, collapsed state). Handles persistence via NSUserDefaults using `src/storage.ts`.
- **src/components/Sidebar.tsx**: Displays list of repositories, branches, and PRs (currently unused).
- **src/components/BranchDetails.tsx**: Shows commits and file changes for a selected branch.
- **src/components/PRDetails.tsx**: Shows PR details and comments (currently unused - app focuses on local branches).

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

### State Persistence

- Uses `react-native Settings` API (wraps NSUserDefaults on macOS)
- Key: `branchReviewer.appState.v1`
- Persists: repos, selectedRepoId, selectedPrId, selectedBranchName, collapsed state
- Migration logic: drops stale demo data from old bundled versions (ids like `r1`, `r2`)

### Types

See `src/types.ts` for TypeScript definitions:

- `Repo`: Repository with id, name, path, branches, commits, files
- `Branch`: Branch name and current flag
- `Commit`: Hash, author, message, dateISO
- `FileChange`: Path, additions, deletions, patch lines
- `PullRequest`: PR metadata (currently unused in local-only workflow)

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
