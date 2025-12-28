# ADR-001: macOS-Only Platform with React Native macOS 0.73

## Status
Approved

## Context
Branch Reviewer is designed for local Git repository review on developer workstations. The target users are macOS developers who need offline, privacy-focused branch review capabilities without cloud dependencies. Supporting multiple platforms would increase complexity, introduce cross-platform abstraction overhead, and dilute the ability to leverage native macOS features for file system access, process management, and UI integration.

## Decision
Build exclusively for macOS 15+ (Sequoia) on Apple Silicon (arm64) using React Native macOS 0.73. No support for iOS, Android, Windows, Linux, or Electron.

## Allowed
- macOS-specific APIs and frameworks:
  - NSUserDefaults for preferences storage
  - NSTask for process spawning (git CLI)
  - NSOpenPanel for native file dialogs
  - NSBundle for app bundle resources
- Platform checks: `Platform.OS === 'macos'`
- CocoaPods dependencies targeting macOS platform
- Xcode workspace configuration for macOS targets only
- Apple Silicon (arm64) architecture optimizations
- macOS 15+ (Sequoia) SDK features
- Conditional imports for macOS-only modules (e.g., safe area context)

## Prohibited
- Cross-platform abstractions for unsupported platforms (iOS, Android, Windows, Linux)
- iOS-specific or Android-specific code, dependencies, or native modules
- Electron or web builds
- Intel (x64) architecture builds (deprecated for new development)
- Importing libraries that require iOS/Android native modules without platform guards
- Universal binaries (arm64 + x64) - arm64 only
- Targeting macOS versions below 15.0

## Consequences

### Positive
- **Smaller, focused codebase**: No cross-platform shims or compatibility layers
- **Native integration**: Direct access to macOS APIs without abstraction penalty
- **Simpler build pipeline**: Single platform target reduces CI/CD complexity
- **Better performance**: No runtime platform detection overhead
- **Richer features**: Can use latest macOS SDK without worrying about fallbacks
- **Easier debugging**: Single platform reduces test matrix

### Negative
- **Limited audience**: Excludes Windows, Linux, and mobile users
- **No cloud companion**: Can't build iOS app for remote review
- **Market size**: Smaller potential user base than cross-platform alternatives
- **Migration cost**: Future cross-platform support would require significant refactoring

## Enforcement

### Build Configuration
- Xcode build scheme configured for macOS-only (`branchReviewer-macOS`)
- package.json scripts target `react-native-macos` platform
- Bundle ID: `com.example.branchreviewer` (macOS-only)

### CI/CD (when added)
- Validate macOS 15+ arm64 builds only
- Block PRs that introduce iOS/Android dependencies
- Type-check with macOS-specific React Native types

### Code Review
- **BLOCKING**: Any code that adds cross-platform abstractions must be rejected
- **BLOCKING**: Dependencies that require iOS/Android native modules without platform guards
- Verify Platform.OS checks are used correctly for macOS-specific code
- Ensure Xcode project only targets macOS SDK

### Documentation
- CLAUDE.md explicitly states macOS-only target
- README prerequisites specify macOS 15+ and Apple Silicon
- No installation instructions for other platforms
