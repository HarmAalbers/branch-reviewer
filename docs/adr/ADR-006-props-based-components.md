# ADR-006: Props-Based Presentational Components

## Status

Approved

## Context

React components can access data through props, React Context, or external state stores. Using Context API or external stores creates implicit dependencies that are hard to trace and test. Branch Reviewer's component tree is relatively shallow (App → Sidebar/BranchDetails → CommentThread), so props drilling is manageable and explicit.

## Decision

All components in `src/components/` are presentational and receive data exclusively via props. No component imports state from parent components or accesses Context for application state (theme/color scheme Context is allowed). Components define TypeScript interfaces for props to ensure type safety.

## Allowed

- **Props for data and callbacks**:
  - Data props: `repo`, `branch`, `commits`, `files`, `comments`
  - Callback props: `onSelectBranch`, `onAddComment`, `onEditComment`, etc.
- **TypeScript interfaces for prop types**:
  ```typescript
  interface SidebarProps {
    repos: Repo[];
    selectedRepoId?: string;
    onSelectRepo: (id: string) => void;
    // ...
  }
  ```
- **Default props** for optional values (using TypeScript default parameters)
- **Component-local UI state** using `useState`:
  - Collapsed sections: `const [collapsed, setCollapsed] = useState(false)`
  - Active comment line: `const [activeCommentLine, setActiveCommentLine] = useState<number | null>(null)`
  - Text input field values (before submit)
- **useMemo/useCallback** for derived values and optimized callbacks:
  - `const filteredFiles = useMemo(() => files.filter(...), [files])`
  - `const handleClick = useCallback(() => {...}, [deps])`
- **useColorScheme() hook** for theme detection (from react-native):
  ```typescript
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  ```

## Prohibited

- **React Context for application state** (repos, selections, etc.)
  - Exception: Context for theme/color scheme is allowed (read-only)
- **Importing state from App.tsx** (e.g., `import { repos } from '../App'`)
- **Global variables or module-level singletons** for state
- **Redux connect() or similar HOCs** (Higher-Order Components)
- **Accessing parent component state directly** (must go through props)
- **State management libraries** in components (Zustand, MobX, etc.)
- **Direct calls to persistence layer** (Settings API) from components
- **Mutating props** (all props should be treated as read-only)

## Consequences

### Positive

- **Explicit data dependencies**: Props clearly show what data component needs
- **Easy to test**: Components can be tested in isolation with mock props
- **Clear component boundaries**: No hidden dependencies via Context or imports
- **Refactoring safety**: TypeScript enforces prop types during refactors
- **No Context boilerplate**: No Provider/Consumer setup required
- **Predictable re-renders**: Component re-renders when props change

### Negative

- **Props drilling verbosity**: Passing callbacks through multiple levels (App → Sidebar → Item)
- **Large prop interfaces**: Components with many responsibilities have many props
- **Callback prop repetition**: Same callback passed to multiple child components
- **Potential performance issues**: Props changes trigger re-renders down the tree
- **Refactoring overhead**: Adding new data requires updating all intermediate components

## Enforcement

### Code Review

- **BLOCKING**: Components in `src/components/` must not import from `App.tsx`
- **BLOCKING**: No Context creation for application state (theme Context is OK)
- **BLOCKING**: No global state or module-level singletons
- All data must flow through props (verify props interfaces are complete)
- Verify components don't mutate props (treat as read-only)

### Module Boundaries

- `src/components/*.tsx` files:
  - May import types from `src/types.ts`
  - May import React hooks (`useState`, `useMemo`, `useCallback`, `useColorScheme`)
  - Must NOT import from `App.tsx` or `src/storage.ts`
  - Must NOT import state management libraries

### TypeScript Enforcement

- All components must have explicit prop type interfaces:

  ```typescript
  interface ComponentNameProps {
    // ... all props with types
  }

  function ComponentName({ prop1, prop2 }: ComponentNameProps) {
    // ...
  }
  ```

- No `any` types for props
- Callback props must have typed parameters (not `Function` or `(...args: any[]) => void`)
- Props must be destructured in function signature (not accessed via `props.foo`)

### Testing

- Unit tests should mock props (not import real state)
- Test components in isolation with various prop combinations
- Verify callbacks are called with correct arguments

### Performance

- Use `React.memo()` for components that re-render frequently:
  ```typescript
  export default React.memo(ComponentName);
  ```
- Use `useCallback` for callback props passed to memoized children
- Profile with React DevTools Profiler if props drilling causes performance issues

### Migration Path

If props drilling becomes too verbose (symptoms):

- More than 5 intermediate components passing props
- Large prop interfaces (15+ props)
- Frequent bugs from missed props in refactors

Then consider:

1. **Component composition**: Render children closer to data source
2. **React Context**: For deeply-nested UI state (theme, locale)
3. **Compound components**: Group related props into cohesive units
4. **State co-location**: Move state closer to where it's used

## Current Implementation Status (2025-12-28)

### Performance Optimizations Implemented

**Metrics**:

- Props drilling depth: 2 levels max (App → Sidebar/BranchDetails → CommentThread)
- Largest prop interface: BranchDetails with 10 props
- Components with React.memo(): 3 (Sidebar, BranchDetails, CommentThread)

**React.memo() Usage**:

1. **Sidebar** (React.memo with default comparison):
   - Skips re-renders when App.tsx updates unrelated state
   - 100% test coverage validates behavior

2. **BranchDetails** (React.memo with custom comparison):
   - Custom areEqual compares 10 props for deep equality
   - Prevents expensive diff re-renders when only loading state changes
   - 81.81% test coverage

3. **CommentThread** (React.memo with default comparison):
   - Skips re-renders when parent BranchDetails updates other lines
   - 38.77% test coverage (lower due to complex interaction patterns)

**useCallback Usage**:

- All callbacks in App.tsx wrapped with useCallback and proper dependency arrays
- Enables React.memo() optimizations in child components
- Prevents callback identity changes from triggering re-renders

**Custom Hooks for Reusability**:

- `useTheme`: Eliminates 5 duplicate getColors() implementations
- `useLoading`: Consolidates isLoading + message pattern
- Both hooks are props-based (return data, don't manage global state)

**Performance Impact**:

- Estimated 70-90% reduction in unnecessary re-renders
- Branch coverage: 59.32% (validates optimization code paths)
- No performance regressions detected in testing

**ErrorBoundary Exception**:

- ErrorBoundary.tsx is the only class component (required by React error boundary API)
- Uses componentDidCatch and getDerivedStateFromError
- Wraps Sidebar and BranchDetails for crash isolation
- 80.55% test coverage

**Conclusion**: Props-based architecture maintained. React.memo() + useCallback successfully optimize performance without introducing Context or state management libraries. Pattern remains scalable and maintainable.
