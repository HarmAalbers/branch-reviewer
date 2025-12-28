# ADR-009: Comprehensive Testing Strategy

## Status

Approved

## Context

Modern software requires robust testing to prevent regressions, enable confident refactoring, and maintain code quality. Branch Reviewer handles user data (repositories, comments) and must not lose data or crash unexpectedly. Testing strategies range from minimal (smoke tests only) to comprehensive (100% coverage with E2E tests). The appropriate level depends on application complexity, team size, and deployment frequency.

## Decision

Maintain comprehensive test coverage with Jest + React Testing Library, targeting minimum 50% coverage across all metrics (statements, branches, functions, lines). Use a layered testing approach: unit tests for pure logic, component tests for UI, and integration tests for workflows. Mock native modules to enable fast test execution without requiring actual Git repositories or macOS-specific APIs.

## Allowed

- **Jest 30+ with React Testing Library** as primary test framework
- **Native module mocking** via `__tests__/setup.ts`:
  - Mock `BRGit` (scanRepo, scanBranch, pickFolder)
  - Mock `Settings` API (NSUserDefaults persistence)
  - Mock `Platform.OS` and `useColorScheme`
- **Coverage thresholds** enforced in jest.config.js:
  - Statements: 50%
  - Branches: 40%
  - Functions: 50%
  - Lines: 50%
- **Test file organization**:
  - Component tests: `__tests__/components/*.test.tsx`
  - Hook tests: `__tests__/hooks/*.test.ts`
  - State management tests: `__tests__/state/*.test.ts`
  - Integration tests: `__tests__/*.integration.test.tsx`
  - Test setup: `__tests__/setup.ts`
- **Test patterns**:
  - Arrange-Act-Assert structure
  - One logical assertion per test (can have multiple expect calls)
  - Clear test names describing behavior ("renders empty state", "calls callback when clicked")
  - beforeEach/afterEach for cleanup
  - Mock configuration per test (not global defaults)
- **Error testing**:
  - Test error paths and edge cases
  - Verify error messages are user-friendly
  - Test error recovery mechanisms (ErrorBoundary, try/catch)
- **Async testing**:
  - Use `waitFor()` for async assertions
  - Use `act()` for state updates
  - Proper timeout configuration (3000ms default)

## Prohibited

- **Skipping tests** with `it.skip` or `describe.skip` (delete instead)
- **Overly generic mocks** (e.g., `jest.fn()` without default behavior)
- **Testing implementation details** (internal state, private methods)
- **Shallow rendering** (use React Testing Library's render, not shallow)
- **Snapshot tests** as primary validation (use explicit assertions)
- **Global test pollution** (each test must be isolated)
- **Ignoring coverage gaps** (coverage thresholds must pass)
- **Committing code that drops coverage** below thresholds

## Consequences

### Positive

- **Regression prevention**: 98 tests catch breaking changes immediately
- **Confident refactoring**: Can refactor with test safety net (enabled Phase 2-3 refactors)
- **Documentation**: Tests document expected behavior and edge cases
- **TDD workflow**: Write test → implement → verify (enforced by coverage gates)
- **Fast feedback**: Tests run in 2-5 seconds locally
- **CI integration**: GitHub Actions runs tests automatically on all PRs

### Negative

- **Initial investment**: Creating 98 tests took significant time
- **Maintenance burden**: Tests must be updated when behavior changes
- **Mock complexity**: Native module mocking requires careful setup
- **Coverage pressure**: Developers must maintain 50%+ coverage on new code
- **False confidence**: High coverage doesn't guarantee absence of bugs

## Enforcement

### Coverage Thresholds (jest.config.js)

**BLOCKING**: All thresholds must pass for tests to succeed:

```javascript
coverageThreshold: {
  global: {
    statements: 50,
    branches: 40,
    functions: 50,
    lines: 50,
  },
}
```

### CI/CD Integration

**BLOCKING**: GitHub Actions fails PR if:

- Any test fails
- Coverage drops below thresholds
- TypeScript compilation fails
- ESLint errors detected

### Pre-commit Hooks

**BLOCKING**: Commits are blocked if:

- TypeScript compilation fails (npx tsc --noEmit)
- ESLint errors exist (auto-fixed by lint-staged)

### Code Review Checklist

- **BLOCKING**: New features must include tests
- **BLOCKING**: Bug fixes must include regression tests
- **BLOCKING**: Refactorings must not drop coverage
- Verify test names are descriptive
- Verify mocks are properly configured (not returning undefined)
- Verify async tests use waitFor/act appropriately

### Test Quality Standards

- Tests must be independent (no shared state between tests)
- Tests must clean up after themselves (jest.clearAllMocks in beforeEach)
- Tests must not rely on test execution order
- Tests must handle async operations correctly
- Error tests must verify error messages and recovery

## Testing Pyramid

### Unit Tests (70% of tests)

**Purpose**: Test pure functions and isolated logic
**Examples**:

- `gitLocal.test.ts`: scanRepo, scanBranch, pickFolder functions
- `storage.test.ts`: loadState, saveState round-trip
- `commentsReducer.test.ts`: All reducer actions
- `useLoading.test.ts`: Hook state management

**Coverage**: 95-100% on utility modules

### Component Tests (25% of tests)

**Purpose**: Test component rendering and user interactions
**Examples**:

- `Sidebar.test.tsx`: Repository list, branch selection
- `BranchDetails.test.tsx`: Commit/file rendering, comment threads
- `ErrorBoundary.test.tsx`: Error catching, reset functionality

**Coverage**: 70-100% on presentational components

### Integration Tests (5% of tests)

**Purpose**: Test full user workflows across multiple components
**Examples**:

- `App.integration.test.tsx`: Add repository, select branch, persistence

**Coverage**: 50-75% on App.tsx (integration hub)

## Current Implementation Status (2025-12-28)

### Test Suite Metrics

**Overall Statistics**:

- Total tests: 98
- Test files: 9
- Coverage: 79.49% overall
- All coverage thresholds: ✅ PASSED

**Coverage by Category**:

- Statements: 79.49% (threshold: 50%) ✅
- Branches: 59.32% (threshold: 40%) ✅
- Functions: 76.42% (threshold: 50%) ✅
- Lines: 79.50% (threshold: 50%) ✅

**100% Coverage Modules**:

- gitLocal.ts (native module integration)
- storage.ts (persistence layer)
- Sidebar.tsx (repository/branch UI)
- useLoading.ts (loading state hook)

**Test Distribution**:

- Unit tests: 68 tests (69%)
- Component tests: 23 tests (23%)
- Integration tests: 7 tests (8%)

### Test Infrastructure

**Mock Setup** (`__tests__/setup.ts`):

- BRGit native module methods throw explicit errors requiring configuration
- Prevents silent test failures from undefined mock returns
- Settings API mocked with proper get/set behavior
- Platform and theme hooks mocked for consistent test environment

**Test Quality**:

- All tests independent (no shared state)
- beforeEach cleanup prevents test pollution
- Async tests use waitFor with proper timeouts
- Error paths comprehensively tested

### CI/CD Integration

**GitHub Actions** (`.github/workflows/ci.yml`):

- Runs full test suite on every push/PR
- Uploads coverage to Codecov for tracking
- Blocks merge if any test fails or coverage drops

**Pre-commit Hooks** (`.husky/pre-commit`):

- TypeScript type checking before commit
- Ensures no broken code enters repository

### Future Enhancements

**Potential Improvements**:

1. Increase CommentThread coverage (currently 38.77%)
2. Add E2E tests with fixture repositories
3. Visual regression testing for UI components
4. Performance benchmarks for large diffs
5. Mutation testing to validate test quality

**Coverage Goals**:

- Short-term (3 months): Maintain >75% coverage
- Long-term (6 months): Achieve 85%+ coverage
- Always: 100% coverage on critical paths (persistence, native integration)

**Conclusion**: Testing strategy successful. 79% coverage provides confidence for refactoring and feature development. TDD workflow enabled. All quality gates automated via CI/CD.
