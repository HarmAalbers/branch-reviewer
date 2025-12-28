# ADR-004: Centralized State Management in App.tsx

## Status

Approved

## Context

React applications require a state management strategy. Options include external libraries (Redux, MobX, Zustand), React Context API, or local component state. Branch Reviewer is a single-window desktop application with moderate state complexity (repos, selections, UI state). Adding Redux/MobX introduces significant boilerplate and learning curve. Context API can lead to unnecessary re-renders and prop drilling alternative still requires component restructuring.

## Decision

Manage all application state in `App.tsx` using React `useState` hooks. Pass state and callbacks down to child components via props (props drilling). Compute derived state using `useMemo` hooks. Keep this pattern until the application grows to a point where it becomes unmaintainable.

## Allowed

- **useState hooks in App.tsx** for all application state:
  - `repos: Repo[]` - Repository data
  - `selectedRepoId?: string` - Selected repository
  - `selectedPrId?: string` - Selected PR (currently unused)
  - `selectedBranchName?: string` - Selected branch
  - `collapsed: Record<string, boolean>` - UI collapsed state
- **Props drilling** to pass state to child components:
  - Sidebar, BranchDetails, PRDetails, CommentThread
- **useMemo for derived state**:
  - `selectedRepo` - Find repo by selectedRepoId
  - `selectedPr` - Find PR by selectedPrId (currently unused)
- **Callback props** for state updates:
  - `onSelectRepo`, `onSelectBranch`, `onSelectPr`
  - `onAddComment`, `onEditComment`, `onDeleteComment`, `onResolveComment`
- **Local component state** for UI-only concerns:
  - Collapsed sections (e.g., `useState` in Sidebar for expand/collapse)
  - Active comment line (ephemeral UI state)
  - Text input field values (before submit)
- **Immutable state updates** using spread operators:
  - `setRepos(prev => [...prev, newRepo])`
  - `setRepos(prev => prev.map(r => r.id === id ? {...r, ...updates} : r))`

## Prohibited

- **Redux, MobX, Zustand, or similar state management libraries**
- **React Context API for application state** (UI theme/color scheme is OK)
- **State management in child components** (except local UI state)
- **Third-party state management libraries** (no external dependencies for state)
- **Global variables or module-level singletons** for state
- **Class components with this.state** (use functional components only)
- **Mutable state updates** (e.g., `repos.push(newRepo)` without copying)
- **State updates outside App.tsx** (children receive callbacks, not setters)

## Consequences

### Positive

- **Simple, predictable data flow**: All state changes go through App.tsx
- **Easy debugging**: React DevTools shows all state in one component
- **No external dependencies**: No Redux/MobX library to learn or maintain
- **Clear component boundaries**: Props define exact data dependencies
- **Fast initial development**: No action types, reducers, or store setup
- **Easy refactoring**: Moving state to Context/Redux later is straightforward

### Negative

- **Props drilling verbosity**: Passing callbacks through multiple levels
- **Re-render optimization needed**: Changes to any state re-renders App.tsx
- **Scaling concerns**: May become unwieldy with 20+ state variables
- **No time-travel debugging**: Can't replay actions like Redux DevTools
- **No state persistence separation**: Persistence logic mixed with state logic

## Enforcement

### Code Review

- **BLOCKING**: New state management libraries (Redux, MobX, etc.) must be rejected
- **BLOCKING**: State management in child components (except local UI state)
- Application state must live in `App.tsx` only
- Child components must receive state via props, not import from App.tsx
- Verify immutable state updates (use spread operators, no mutations)

### Component Architecture

- `App.tsx` is the **only** component that:
  - Calls `useState` for application state
  - Calls `loadState()` and `saveState()`
  - Manages repos, selections, and persistent state
- Child components (Sidebar, BranchDetails, etc.):
  - Receive state via props only
  - Receive callbacks via props for mutations
  - May use `useState` for local UI state (collapsed, activeComment)

### TypeScript Enforcement

- Props interfaces must explicitly list all state dependencies
- No `any` types for props (use specific types from `src/types.ts`)
- Callback props must have typed parameters (not `(...args: any[]) => void`)

### Performance

- Use `useMemo` for expensive derived state (e.g., filtering large lists)
- Use `useCallback` for callbacks passed to child components (prevent re-renders)
- Profile with React DevTools Profiler if performance issues arise

### Migration Path

If state management becomes unwieldy (symptoms):

- More than 15 useState calls in App.tsx
- Props drilling more than 3 levels deep
- Frequent bugs from stale closures or race conditions

Then consider:

1. **First**: Refactor with useReducer in App.tsx (same pattern, less boilerplate)
2. **Second**: Add React Context for deeply-nested state (e.g., theme, user prefs)
3. **Last resort**: Migrate to Redux/Zustand (requires new ADR superseding this one)

## Current Implementation Status (2025-12-28)

### Successfully Migrated to useReducer Pattern

**Metrics**:

- useState hooks: 5 (was 7, target: <15) ✅
- Props drilling: 2 levels max (target: <3) ✅
- App.tsx lines: 298 (was 516, -42% reduction) ✅

**Comment Management Migration**:

- Migrated complex comment CRUD to `src/state/commentsReducer.ts`
- Actions: ADD_COMMENT, ADD_LINE_COMMENT, EDIT_LINE_COMMENT, DELETE_LINE_COMMENT, TOGGLE_RESOLVE_LINE_COMMENT
- Eliminated 150+ lines of deeply nested state logic
- Pure reducer function enables comprehensive testing (95.83% coverage)

**Custom Hooks Introduced**:

- `useLoading` (src/hooks/useLoading.ts): Consolidates loading state pattern, 100% coverage
- `useTheme` (src/hooks/useTheme.ts): Centralized theme system, 63.63% coverage

**Performance Optimizations**:

- All callbacks wrapped with `useCallback` (prevents child re-renders)
- Components use `React.memo()` for skip-render optimization
- Theme colors memoized with `useMemo`

**Test Coverage**:

- Overall: 79.49% (exceeds ADR-009 threshold of 50%)
- App.tsx: 75.25% (was 16.56%)
- Comment management: 95.83% via commentsReducer tests

**Conclusion**: Migration to useReducer successful. State management now maintainable at current complexity level. No need for Context or Redux at this time.
