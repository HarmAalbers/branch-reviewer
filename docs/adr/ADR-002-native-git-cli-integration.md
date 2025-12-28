# ADR-002: Native Git CLI Integration via BRGit Module

## Status
Approved

## Context
Branch Reviewer needs to read Git repository data (branches, commits, diffs) from local filesystems. Options include native Git libraries (libgit2, NodeGit), parsing .git directory internals directly, or shelling out to the git CLI. Native libraries add significant dependencies, require careful memory management, and may have version compatibility issues. Parsing .git internals is fragile and breaks with Git version changes.

## Decision
Implement a lightweight native Objective-C++ module (BRGit) embedded in `macos/branchReviewer-macOS/AppDelegate.mm` that shells out to the git CLI using NSTask. All Git operations execute on a background dispatch queue and return JSON to JavaScript via React Native bridge.

## Allowed
- **BRGit native module** in `AppDelegate.mm` (single file, embedded in app delegate)
- **Shelling out to git CLI** via `/usr/bin/env git` (ensures PATH resolution)
- **NSTask** for process spawning with these configurations:
  - Launch path: `/usr/bin/env`
  - Arguments: `["git", "subcommand", ...]`
  - Environment includes Homebrew paths: `/opt/homebrew/bin:/usr/local/bin:$PATH`
- **Background execution** on dispatch queue: `QOS_CLASS_USER_INITIATED`
- **JSON return values** from native module to JavaScript
- **Synchronous git operations** within native code (async from JS perspective)
- **Error handling** for:
  - Missing git binary
  - Invalid repository paths
  - Git command failures
- **Progress callbacks** during long-running operations (scanRepo)
- **Three exported methods**:
  - `scanRepo(path: string)` - Full repository scan
  - `scanBranch(path, branchName, baseBranch)` - Lazy-load branch data
  - `pickFolder()` - Native file dialog (uses NSOpenPanel, not git-related)

## Prohibited
- **libgit2** or **NodeGit** dependencies (no native Git libraries)
- **Git operations on main thread** (blocks UI)
- **Creating separate native module Xcode targets** (keep embedded in AppDelegate)
- **Parsing .git directory internals** directly (fragile, breaks with Git changes)
- **Third-party Git library bindings** (Swift, C++, or otherwise)
- **Executing git commands from JavaScript** (must go through BRGit native module)
- **Synchronous Native Module methods** (all must return Promises to avoid blocking JS thread)
- **Hardcoding git binary path** (use `/usr/bin/env git` for PATH resolution)

## Consequences

### Positive
- **Simple implementation**: ~500 lines of Objective-C++, no external dependencies
- **No native dependencies**: Avoids CocoaPods complexity for Git libraries
- **git CLI universally available**: Installed by Xcode or Homebrew on all dev Macs
- **Predictable behavior**: git CLI is well-tested and stable across macOS versions
- **Easy debugging**: Can test git commands in terminal independently
- **Flexible**: Easy to add new git operations by adding NSTask invocations
- **Homebrew compatibility**: Ensures git from Homebrew is found on Apple Silicon

### Negative
- **git binary dependency**: Requires git installed (Xcode Command Line Tools or Homebrew)
- **Git version variability**: Output format changes could break parsing
- **No git performance control**: Slower than native libgit2 for some operations
- **Text parsing required**: Must parse git CLI output (JSON not available)
- **Process overhead**: NSTask spawning has more overhead than library calls
- **Error handling complexity**: Must parse stderr for error messages

## Enforcement

### Code Review
- **BLOCKING**: New Git parsing logic must be in BRGit module (`AppDelegate.mm`)
- **BLOCKING**: Git operations must not be added to JavaScript layer directly
- **BLOCKING**: No imports of libgit2, NodeGit, or similar libraries
- Verify all git NSTask calls include Homebrew paths in environment
- Ensure git operations execute on background queue, not main thread
- Check error handling for git command failures

### Architecture
- Native module must remain in `AppDelegate.mm` (single file, embedded)
- All git invocations must use NSTask with `/usr/bin/env git`
- Return values must be JSON-serializable for React Native bridge

### Testing
- Manual testing: Verify git binary is found with `which git`
- Edge cases: Test with repos that have missing base branch, no commits, etc.
- Error cases: Test with invalid paths, missing git binary

### Documentation
- CLAUDE.md documents BRGit native module architecture
- Comments in AppDelegate.mm explain git command usage
- Prerequisites list git installation requirement (Homebrew or Xcode)
