# ADR-005: Lazy Loading Strategy for Branch Data

## Status
Approved

## Context
Git repositories can have hundreds of branches, each with hundreds of commits and thousands of changed files. Loading all commit history and diffs for every branch upfront would cause slow application startup (10+ seconds for large repos), memory bloat (hundreds of MB), and poor initial user experience. Users typically focus on one branch at a time, so preloading all data is wasteful.

## Decision
Load branch metadata (names, current branch flag) immediately with `scanRepo()`, but defer loading commits and file diffs until a branch is selected via `scanBranch()`. Cache loaded branch data in application state to avoid re-loading on re-selection. Show loading indicators during lazy load operations.

## Allowed
- **scanRepo()** loads minimal data:
  - List of all local branches (`git branch --list`)
  - Current branch name (`git rev-parse --abbrev-ref HEAD`)
  - Base branch name (`git symbolic-ref refs/remotes/origin/HEAD` or fallback to main/master)
  - Commits and files **ONLY for current branch** (initially selected)
- **scanBranch()** loads full data for specific branch:
  - Commits since base branch (`git log base..branch -n 100`)
  - File change counts (`git diff --numstat base..branch`)
  - **Patch data loaded separately** (not in initial scanBranch)
- **Triggering scanBranch()** when:
  - User selects a branch in Sidebar
  - Branch has not been loaded yet (no commits or files in state)
- **Caching loaded branch data** in state:
  - Once loaded, branch data persists until repo is re-scanned
  - Switching back to a loaded branch does not trigger re-load
- **Loading indicators** during async operations:
  - Overlay with "Loading..." message during scanRepo
  - Spinner or skeleton UI during scanBranch (future improvement)
- **Progress callbacks** for long operations:
  - scanRepo reports progress: "Loading branches...", "Loading current branch..."

## Prohibited
- **Loading all branch data in scanRepo()** (only load current branch initially)
- **Preloading branches speculatively** (e.g., loading all branches in background)
- **Background loading of unselected branches** (lazy load on-demand only)
- **Eager diff parsing for all files** (load patches when file is expanded)
- **Infinite scrolling for commits** (load fixed window of 100 commits per branch)
- **Automatic re-scanning on state change** (user must explicitly refresh)

## Consequences

### Positive
- **Fast initial scan**: Loading one branch vs. all branches (1-2s vs. 30s for large repos)
- **Reduced memory usage**: Only loaded branches consume memory
- **Better UX**: App responsive immediately, data loads on-demand
- **Scalable**: Handles repos with hundreds of branches efficiently
- **No network calls**: All operations local (N/A for local-only app)

### Negative
- **Slight delay on branch selection**: 1-2s load time when selecting new branch
- **Loading state management**: Must handle loading, error, and success states
- **Cache invalidation complexity**: Loaded data can become stale if repo changes externally
- **Inconsistent initial view**: Current branch loaded, others not (user may be confused)

## Enforcement

### Type System
- **scanRepo() return type**:
  ```typescript
  {
    branches: Branch[]        // Just names and current flag
    currentBranch: string
    baseBranch: string
    commits: Commit[]         // ONLY for current branch
    files: FileChange[]       // ONLY for current branch
  }
  ```
- **scanBranch() return type**:
  ```typescript
  {
    commits: Commit[]
    files: FileChange[]       // Counts only, no patches initially
  }
  ```

### Code Review
- **BLOCKING**: scanRepo() must not load commits/files for all branches
- **BLOCKING**: Speculative preloading (loading branches not selected by user)
- Verify scanBranch() is called on branch selection in App.tsx
- Check that loading state is shown during async operations
- Ensure branch data is cached in state (not re-fetched on re-selection)

### UX Requirements
- **Loading indicators** must be visible during all async operations
- **Error messages** must be shown if scanBranch() fails
- **Cache invalidation** (future): Add "Refresh" button to re-scan repo

### Performance Targets
- scanRepo() on typical repo: < 2 seconds
- scanBranch() on typical branch: < 1 second
- Total memory usage: < 200MB for 10 loaded branches

### Testing
- Test with repo containing 100+ branches (verify only current loaded initially)
- Test branch selection (verify scanBranch() is called)
- Test re-selecting loaded branch (verify no re-fetch)
- Test switching repos (verify previous repo data is not leaked)
