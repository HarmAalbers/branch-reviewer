# ADR-007: Metro + Xcode Dual Build Pipeline

## Status
Approved

## Context
React Native macOS requires JavaScript bundling for both development and production. Debug builds benefit from Metro's fast refresh and hot module reloading, while Release builds need a self-contained bundle embedded in the .app package. Mixing Debug and Release strategies causes issues: stale pre-bundled code in Debug mode, or Metro dependency in Release builds. A clear separation is needed.

## Decision
Use Metro bundler running on port 8081 for Debug builds (with fast refresh), and Xcode build phase scripts for Release builds (embedding main.jsbundle in .app). Debug builds connect to Metro unless `USE_PREBUNDLED_DEBUG=1` is set. Release builds always use embedded bundle.

## Allowed
- **Metro bundler for Debug builds**:
  - Running on port 8081 (`npm start` or `just start`)
  - Fast refresh and hot module reloading enabled
  - JavaScript served from Metro dev server
  - Fallback to pre-bundled `macos/main.jsbundle` if `USE_PREBUNDLED_DEBUG=1` env var set
- **Xcode build phase script for Release builds**:
  - Automatically bundles JavaScript during Xcode Release build
  - Embeds bundle in .app package at build time
  - No Metro dependency for Release .app
- **Separate bundle command**: `npm run bundle:macos` or `just bundle-macos`:
  - Creates `macos/main.jsbundle` and asset files manually
  - Used for testing Release-like bundles in Debug mode
  - Useful for debugging bundle-specific issues
- **Just task runner** for workflow automation:
  - `just dev` - Install deps, pods, start Metro
  - `just start` - Start Metro only
  - `just macos` - Launch macOS app (requires Metro running for Debug)
  - `just build-app` - Create Release .app via xcodebuild
  - `just bundle-macos` - Bundle JavaScript only
- **Metro configuration** in `metro.config.js`:
  - Watchman integration for fast file watching
  - Blacklist/ignore patterns for heavy directories

## Prohibited
- **Committing main.jsbundle to version control** (.gitignore includes `macos/main.jsbundle`)
- **Requiring Metro for Release builds** (Release .app must be standalone)
- **Hardcoded bundle paths in Debug builds** (use Metro URL or fallback)
- **Mixing Debug/Release bundle strategies** (Debug = Metro, Release = embedded)
- **Bundling on every Debug run** (Metro dev server is preferred for iteration)
- **Pre-bundling in Debug by default** (only via USE_PREBUNDLED_DEBUG env var)
- **Manual bundling steps in Xcode Release build** (build script automates this)

## Consequences

### Positive
- **Fast Debug iteration**: Metro fast refresh updates code instantly (<1s)
- **Standalone Release builds**: .app works offline without Metro
- **Clear separation**: Debug and Release modes don't interfere
- **Debugging flexibility**: Can test pre-bundled code in Debug mode if needed
- **Standard RN workflow**: Follows React Native best practices
- **Just automation**: Simple commands for common tasks

### Negative
- **Metro must be running for Debug**: Common pain point for new developers
- **Build scripts can break**: React Native upgrades may break bundling scripts
- **Two bundle mechanisms**: Debug (Metro) and Release (Xcode script) must stay in sync
- **Bundle size not optimized**: No advanced minification or tree-shaking (standard RN limitations)
- **Debug errors if Metro down**: "No bundle URL present" error confuses developers

## Enforcement

### .gitignore
- **MUST include**:
  ```
  macos/main.jsbundle
  macos/main.jsbundle.meta
  macos/assets/
  ```
- Prevents accidental commit of generated bundles

### Xcode Build Scripts
- **Release configuration** must have build phase script:
  ```bash
  export NODE_BINARY=node
  ../node_modules/react-native/scripts/react-native-xcode.sh
  ```
- Validates bundle generation happens automatically

### Documentation
- **CLAUDE.md** warns about Metro requirement for Debug builds
- **README** explains Debug vs Release build differences
- **Justfile** provides clear commands for each workflow

### Code Review
- **BLOCKING**: Changes to Xcode build scripts must be reviewed carefully
- **BLOCKING**: Any attempt to commit main.jsbundle must be rejected
- Verify Metro configuration changes don't break Debug builds
- Check that Release builds still work after Metro config changes

### Testing Checklist
Before each release:
1. **Debug build**: Verify Metro fast refresh works (`just dev`, `just macos`)
2. **Release build**: Verify .app works offline (`just build-app`, test without Metro)
3. **Bundle manually**: Verify manual bundling works (`just bundle-macos`)
4. **Clean build**: Test from scratch (delete node_modules, Pods, build/)

### Common Issues

**"No bundle URL present" in Debug**:
- **Cause**: Metro not running
- **Fix**: Run `npm start` or `just start` in separate terminal

**Stale code in Debug build**:
- **Cause**: Pre-bundled main.jsbundle exists and Metro down
- **Fix**: Delete `macos/main.jsbundle`, restart Metro

**Release build doesn't update**:
- **Cause**: Xcode using cached bundle
- **Fix**: Clean build folder (Cmd+Shift+K in Xcode)

### Watchman Integration
- `.watchmanconfig` optimizes file watching:
  - Ignores: `.git`, `node_modules`, `macos/Pods`, `macos/build`, `.metro-cache`
  - Prevents expensive recrawls on large directories
- **Reset Watchman** if recrawl warnings occur:
  ```bash
  just watchman-reseed
  # or manually:
  watchman watch-del /path/to/branchReviewer
  watchman watch-project /path/to/branchReviewer
  ```
