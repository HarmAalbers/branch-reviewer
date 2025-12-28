# Branch Reviewer — macOS (React Native macOS)

A production-ready macOS application for reviewing Git branches locally. Built with React Native macOS 0.78, React 19, and modern testing infrastructure.

**Status**: ✅ Production-ready with 79% test coverage, CI/CD automation, and comprehensive error handling.

**Tech Stack**:

- React 19.2.3 + React Native macOS 0.78.6
- TypeScript 5.6.3 (strict mode)
- Jest 30.2.0 + React Testing Library
- 98 tests, 79.49% coverage
- GitHub Actions CI/CD
- Pre-commit hooks (Husky + lint-staged)

## Quickstart (run locally)

1. Install prerequisites (macOS 15+, Xcode 16 CLI tools, Node 20+, CocoaPods):
   - Xcode: install from the App Store, then run: `xcode-select --install`
   - Homebrew (optional): https://brew.sh
   - With Homebrew: `brew install node watchman just` (just = task runner used by this repo)
   - CocoaPods: `sudo gem install cocoapods`
2. Install JS deps:
   ```sh
   npm install
   ```
3. Install CocoaPods for the macOS target:
   ```sh
   cd macos && pod install
   ```
4. Run the app in Debug:
   - Terminal A (Metro bundler):
     ```sh
     npm start
     # or: just start
     ```
   - Terminal B (launch the macOS app):
     ```sh
     npm run macos
     # or: just macos
     ```
     Tip: You can also open `macos/branchReviewer.xcworkspace` in Xcode and press Run.

## Testing

The project has comprehensive test coverage with automated quality gates.

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test
npm test __tests__/components/Sidebar.test.tsx
```

**Test Coverage** (as of 2025-12-28):

- Overall: 79.49% (exceeds 50% threshold)
- Branches: 59.32% (exceeds 40% threshold)
- Functions: 76.42% (exceeds 50% threshold)
- 98 comprehensive tests across 9 test files

**100% Coverage Modules**:

- gitLocal.ts (native module integration)
- storage.ts (NSUserDefaults persistence)
- Sidebar.tsx (repository/branch list)
- useLoading.ts (loading state hook)

## CI/CD

### GitHub Actions

Automated workflows run on every push and PR:

1. **CI Pipeline** (`.github/workflows/ci.yml`):
   - Lint (ESLint)
   - Type check (TypeScript)
   - Test (Jest with coverage)
   - Build (Xcode Release build)
   - Coverage upload (Codecov)

2. **Dependency Review** (`.github/workflows/dependency-review.yml`):
   - Scans for vulnerable dependencies
   - Blocks high/critical vulnerabilities

### Pre-commit Hooks

Husky + lint-staged automatically run on every commit:

```bash
# Install hooks (first time)
just hooks-install

# Hooks run automatically on git commit:
# 1. ESLint --fix (auto-fixes staged .ts/.tsx files)
# 2. Prettier --write (formats all staged files)
# 3. TypeScript type checking (npx tsc --noEmit)
# 4. Commit blocked if any step fails
```

Optional: view helper tasks

```sh
just help
```

## Using just (task runner, optional)

Common recipes:

```sh
just install            # npm install
just hooks-install      # install Husky pre-commit hooks
just pods               # cd macos && pod install
just start              # start Metro bundler
just macos              # run the macOS app
just bundle-macos       # create macos/main.jsbundle + assets
just build-app          # xcodebuild Release (arm64)
just package-dmg        # create unsigned DMG from Release .app
just test               # run Jest tests
just lint               # run ESLint
just typecheck          # run TypeScript
just fmt                # Prettier format
just clean              # remove node_modules and reinstall
just clean-metro-cache  # clear Metro cache and Watchman state
just watchman-reseed    # reseed Watchman for this project
just versions           # print key tool versions
```

## Prerequisites

- macOS 15 (Sequoia) on Apple Silicon
- Xcode 16+ with command line tools
- Node.js 20+
- CocoaPods (`sudo gem install cocoapods`) if not already installed

Install via Homebrew (optional):

```sh
brew install node watchman just
```

Verify tools:

```sh
node -v
npm -v
npx react-native --version || npx react-native-macos --version
ruby -v || true
pod --version
```

## Install

```sh
npm install
```

## First‑time macOS setup

The macOS project and pods were generated already, but you can re‑install pods if needed:

```sh
cd macos && pod install
```

## Run (Debug)

In one terminal (Metro must be running to avoid "No bundle URL present"):

```sh
npm start
```

In another terminal:

```sh
npm run macos
```

Or open `macos/branchReviewer.xcworkspace` in Xcode and press Run.

Note: Debug builds no longer auto-copy the pre-bundled `macos/main.jsbundle`. This prevents stale demo code from loading. If you really need to run Debug from a prebuilt bundle (offline), set the Xcode build setting environment variable `USE_PREBUNDLED_DEBUG=1` for the scheme, or export it in the environment before building. Otherwise keep Metro running.

Tip: If you want to run without Metro, build the app in Release. The Xcode RN build script will bundle JavaScript (main.jsbundle) into the app automatically for Release builds.

## Open a local Git repository

- Click the "Open Local Repo…" button in the top bar.
- Paste a local path like `/Users/me/projects/my-repo` and press Add.
- The app will add the repo, populate a list of local branches, auto-select the current branch, and show commits since the base branch (main/master) along with changed files and small patches.
- Your repos and selections are remembered between launches (stored in NSUserDefaults via React Native Settings).
- Requirements: `git` must be installed and available on your PATH (Homebrew installs it to `/opt/homebrew/bin/git`).
- Privacy: The app shells out to the local `git` CLI only and reads repository data locally; nothing is uploaded.

## Build a Release .app

From Xcode: select the `branchReviewer-macOS` scheme, set configuration to Release, and Product → Build. The `.app` will be under `~/Library/Developer/Xcode/DerivedData/.../Build/Products/Release/branchReviewer.app`.

From CLI:

```sh
xcodebuild -workspace macos/branchReviewer.xcworkspace \
  -scheme branchReviewer-macOS \
  -configuration Release \
  -arch arm64 \
  build
```

## Create an unsigned .dmg (optional)

Replace APP_PATH with your built app path:

```sh
APP_PATH="$(find ~/Library/Developer/Xcode/DerivedData -name branchReviewer.app -path "*Build/Products/Release/*" -print -quit)"
DMG=branchReviewer-unsigned.dmg
[ -d "$APP_PATH" ] && hdiutil create -volname "Branch Reviewer" -srcfolder "$APP_PATH" -ov -format UDZO "$DMG"
echo "Created $DMG"
```

Notes:

- Bundle ID: `com.example.branchreviewer`
- Minimum macOS: 15.0; Architecture: arm64 only
- Android, iOS, and Electron targets have been removed.

## Troubleshooting

- Watchman recrawl warnings (MustScanSubDirs / UserDropped):
  - Reason: Watchman had to rescan the tree, often due to large directories or transient FS events.
  - Fix: Reseed the Watchman watch for this project and clear Metro cache.
    ```sh
    just watchman-reseed
    just clean-metro-cache
    ```
  - This repo ships a .watchmanconfig that ignores heavy directories (node_modules, Pods, build, .metro-cache, etc.) to minimize recrawls. See: https://facebook.github.io/watchman/docs/troubleshooting.html#recrawl
