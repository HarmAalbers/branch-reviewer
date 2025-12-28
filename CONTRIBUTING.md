# Contributing to Branch Reviewer

Thank you for your interest in contributing to Branch Reviewer! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Testing Requirements](#testing-requirements)
- [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
- [Submitting Changes](#submitting-changes)
- [Code Review Process](#code-review-process)
- [Need Help?](#need-help)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **macOS 15 (Sequoia) on Apple Silicon** (this is a macOS-only app)
- **Xcode 16+** with command line tools: `xcode-select --install`
- **Node.js 20+** (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- **CocoaPods**: `sudo gem install cocoapods`
- **Git** installed and on PATH (Homebrew: `brew install git`)
- **just** (optional, but recommended): `brew install just`

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/branchReviewer.git
   cd branchReviewer
   ```

3. **Install dependencies**:

   ```bash
   npm install
   # or: just install
   ```

4. **Install CocoaPods**:

   ```bash
   cd macos && pod install && cd ..
   # or: just pods
   ```

5. **Install pre-commit hooks**:

   ```bash
   npm install  # This runs the "prepare": "husky" script automatically
   # or: just hooks-install
   ```

6. **Verify everything works**:

   ```bash
   # Run tests
   npm test

   # Type check
   npx tsc --noEmit

   # Lint
   npm run lint

   # Start Metro bundler
   npm start
   # In a separate terminal:
   npm run macos
   ```

## Development Workflow

We follow **Test-Driven Development (TDD)** and strict code quality practices.

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or: git checkout -b fix/issue-description
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements

### 2. Write Tests First (TDD)

Before writing implementation code:

```bash
# Create your test file in __tests__/
# Example: __tests__/components/YourComponent.test.tsx

# Run tests in watch mode
npm test -- --watch
```

**Test requirements**:

- All new features MUST have tests
- Bug fixes MUST include regression tests
- Coverage must not drop below 50% (statements/functions/lines), 40% (branches)
- Aim for 80%+ coverage on new code

### 3. Implement Your Changes

Follow the project's architecture patterns (see [CLAUDE.md](./CLAUDE.md)):

- **State Management**: Use `useState`, `useReducer`, or custom hooks
- **Component Performance**: Wrap with `React.memo()`, use `useCallback` for handlers
- **Types**: Add TypeScript types in `src/types.ts` or co-located with components
- **Error Handling**: Use `ErrorBoundary.tsx` for component crashes

### 4. Run Quality Checks

Before committing, ensure all checks pass:

```bash
# Run all tests
npm test

# Type check
npx tsc --noEmit
# or: just typecheck

# Lint
npm run lint
# or: just lint

# Format
npx prettier --write .
# or: just fmt
```

### 5. Commit Your Changes

Commits will automatically trigger pre-commit hooks:

```bash
git add .
git commit -m "feat: Add feature description"
```

**Pre-commit hooks will**:

1. Auto-fix ESLint errors on staged files
2. Auto-format with Prettier
3. Run TypeScript type checking
4. **Block the commit** if validation fails

**Commit message format**:

- `feat: Add new feature` - New features
- `fix: Fix bug description` - Bug fixes
- `docs: Update documentation` - Documentation
- `refactor: Refactor component` - Code refactoring
- `test: Add tests for feature` - Test additions
- `chore: Update dependencies` - Maintenance

**IMPORTANT**: If pre-commit hooks fail due to unrelated test failures or type errors, **DO NOT bypass hooks**. Fix the issues first:

```bash
# If tests fail
npm test -- --coverage

# If type check fails
npx tsc --noEmit

# Fix issues, then stage and commit again
git add .
git commit -m "your message"
```

### 6. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a PR on GitHub.

## Code Quality Standards

### TypeScript

- **Strict mode enabled**: No implicit `any` types
- **Type all props and state**: Use interfaces or types from `src/types.ts`
- **No `any` escapes** without documented justification
- **Type function parameters and returns** explicitly

Example:

```typescript
// Good
interface Props {
  onSelect: (branchName: string) => void;
  branches: Branch[];
}

const BranchList: React.FC<Props> = ({ onSelect, branches }) => {
  // ...
};

// Bad
const BranchList = (props: any) => {
  // ❌ No 'any'
  // ...
};
```

### React Patterns

Follow modern React 19 + React Native 0.78 patterns:

1. **Function Components**: Use function components, not class components
2. **Hooks**: Use built-in hooks (`useState`, `useReducer`, `useCallback`, `useMemo`)
3. **Custom Hooks**: Extract reusable logic (see `src/hooks/`)
4. **Memoization**: Use `React.memo()` for expensive components
5. **Error Boundaries**: Wrap UI sections in `<ErrorBoundary>`

Example:

```typescript
import React, { useState, useCallback } from 'react';

export const MyComponent: React.FC<Props> = React.memo(({ onAction }) => {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
    onAction();
  }, [onAction]);

  return <Button onPress={handleClick}>Count: {count}</Button>;
});
```

### Code Style

- **Prettier** enforces formatting (runs automatically on commit)
- **ESLint** catches common issues (auto-fixes on commit)
- **4-space indentation** for TypeScript/JavaScript
- **Descriptive variable names**: `selectedBranch` not `sb`
- **No console.log in production code** (use proper logging or remove)

## Testing Requirements

### Test Structure

Tests are located in `__tests__/` and organized by category:

```
__tests__/
├── components/          # React component tests
├── integration/         # Integration tests
├── unit/               # Unit tests (utilities, hooks)
└── setup.ts            # Test setup and mocks
```

### Writing Tests

Use **Jest** + **@testing-library/react-native**:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../src/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('should handle click events', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);

    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Coverage Requirements

- **Minimum**: 50% statements/functions/lines, 40% branches
- **Target**: 80%+ for new code
- **Critical paths**: Error handling, state management, native modules should have high coverage

Check coverage:

```bash
npm test -- --coverage
```

### Native Module Mocking

The `BRGit` native module is mocked in `__tests__/setup.ts`. To customize:

```typescript
import { NativeModules } from 'react-native';

// In your test
(NativeModules.BRGit.scanRepo as jest.Mock).mockResolvedValue({
  // your mock data
});
```

## Architecture Decision Records (ADRs)

**CRITICAL**: Before implementing any feature, review relevant ADRs in `docs/adr/`.

### Key ADRs to Know

| ADR                                                         | Title                                            | Key Rules                                         |
| ----------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| [ADR-001](docs/adr/ADR-001-macos-only-platform.md)          | macOS-Only Platform with React Native macOS 0.73 | macOS 15+ on Apple Silicon only                   |
| [ADR-002](docs/adr/ADR-002-native-git-cli-integration.md)   | Native Git CLI Integration via BRGit Module      | Shell out to local git binary                     |
| [ADR-003](docs/adr/ADR-003-nsuserdefaults-persistence.md)   | NSUserDefaults for State Persistence             | Use React Native Settings API                     |
| [ADR-004](docs/adr/ADR-004-centralized-state-management.md) | Centralized State Management in App.tsx          | Use hooks, not Redux/MobX                         |
| [ADR-005](docs/adr/ADR-005-lazy-loading-branch-data.md)     | Lazy Loading Strategy for Branch Data            | Load commits only when branch selected            |
| [ADR-006](docs/adr/ADR-006-props-based-components.md)       | Props-Based Presentational Components            | Pass data via props, not Context                  |
| [ADR-007](docs/adr/ADR-007-metro-xcode-build-pipeline.md)   | Metro + Xcode Dual Build Pipeline                | **CRITICAL**: Avoid Metro resolver stack overflow |
| [ADR-008](docs/adr/ADR-008-local-only-review-comments.md)   | Local-Only Inline Review Comments                | **BLOCKING**: No network calls allowed            |
| [ADR-009](docs/adr/ADR-009-testing-strategy.md)             | Comprehensive Testing Strategy                   | 50%+ coverage required                            |

### ADR Compliance

**Before implementing**:

1. Search `docs/adr/` for relevant decisions
2. Follow established patterns
3. If proposing a change to an ADR, discuss in an issue first

**Examples**:

- Adding analytics? ❌ **Blocked by ADR-008** (local-only)
- Adding Redux? ❌ **Blocked by ADR-004** (use hooks)
- Supporting iOS? ❌ **Blocked by ADR-001** (macOS-only)

## Submitting Changes

### Before You Submit

✅ **Checklist**:

- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npx prettier --write .`)
- [ ] Test coverage hasn't decreased
- [ ] Changes follow relevant ADRs
- [ ] Documentation updated (if needed)
- [ ] No console.log statements in production code

### Pull Request Guidelines

When creating a PR:

1. **Title**: Use conventional commit format
   - `feat: Add dark mode toggle`
   - `fix: Resolve crash on invalid repo path`
   - `docs: Update contribution guidelines`

2. **Description**: Include:
   - **Summary**: What does this PR do?
   - **Motivation**: Why is this change needed?
   - **Test Plan**: How did you verify the changes?
   - **Screenshots** (if UI changes)
   - **Related Issues**: Fixes #123

3. **Keep PRs focused**: One feature/fix per PR (easier to review)

4. **Update tests**: Add/update tests for changed code

### PR Template

```markdown
## Summary

Brief description of the changes

## Motivation

Why is this change necessary?

## Test Plan

- [ ] Added unit tests
- [ ] Added integration tests
- [ ] Manually tested on macOS 15
- [ ] Verified no coverage decrease

## Checklist

- [ ] Tests pass
- [ ] Type check passes
- [ ] Linting passes
- [ ] ADRs reviewed and followed
- [ ] Documentation updated
```

## Code Review Process

### What Reviewers Look For

1. **Functionality**: Does the code work as intended?
2. **Tests**: Are changes adequately tested?
3. **Type Safety**: Are types correct and complete?
4. **Performance**: Are there unnecessary re-renders or expensive operations?
5. **ADR Compliance**: Does the code follow architectural decisions?
6. **Security**: Are there input validation issues or security risks?
7. **Code Style**: Is the code readable and maintainable?

### Review Timeline

- **Initial review**: Within 1-2 business days
- **Follow-up**: Within 1 business day of updates
- **Merge**: After all checks pass and approval received

### Addressing Feedback

- Respond to all review comments
- Push new commits (don't force-push during review)
- Mark conversations as resolved when addressed
- Re-request review after addressing feedback

## Security

See [SECURITY.md](./SECURITY.md) for security guidelines.

**Key security rules**:

- ❌ **Never add network calls** (ADR-008)
- ❌ **Never commit secrets** (API keys, tokens, etc.)
- ✅ **Validate all user inputs** (file paths, repository paths)
- ✅ **Add tests for security-critical code**
- ✅ **Report vulnerabilities privately** (not in public issues)

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community guidelines.

**TL;DR**: Be respectful, inclusive, and professional.

## Tooling Reference

### just Commands

Quick reference for `just` recipes (see `justfile`):

```bash
just install         # Install dependencies
just pods            # Install CocoaPods
just dev             # Start Metro bundler
just macos           # Run macOS app
just test            # Run Jest tests
just lint            # Run ESLint
just typecheck       # Run TypeScript compiler
just fmt             # Format with Prettier
just clean           # Clean build artifacts
just build-app       # Build Release .app
just package-dmg     # Create DMG
```

### npm Scripts

```bash
npm install          # Install dependencies
npm start            # Start Metro bundler
npm run macos        # Run macOS app
npm test             # Run Jest tests
npm run lint         # Run ESLint
npm run bundle:macos # Bundle JavaScript for release
```

## Need Help?

### Resources

- **Project docs**: [CLAUDE.md](./CLAUDE.md) - Comprehensive project guide
- **ADRs**: `docs/adr/` - Architecture decisions
- **Test examples**: `__tests__/` - Example test patterns
- **React Native docs**: https://reactnative.dev/
- **React Native macOS docs**: https://microsoft.github.io/react-native-windows/

### Getting Support

1. **Search existing issues**: Your question might already be answered
2. **Check documentation**: CLAUDE.md and ADRs cover most topics
3. **Open an issue**: For bugs, use the bug report template
4. **Discussions**: For questions, use GitHub Discussions

### First-Time Contributors

Look for issues labeled `good first issue` or `help wanted`. These are great starting points!

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](./LICENSE)).

---

**Thank you for contributing to Branch Reviewer!** Your time and effort help make this tool better for everyone.

**Last Updated**: 2025-12-28
