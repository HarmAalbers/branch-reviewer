# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Branch Reviewer project.

## ADR Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](ADR-001-macos-only-platform.md) | macOS-Only Platform with React Native macOS 0.73 | Approved |
| [ADR-002](ADR-002-native-git-cli-integration.md) | Native Git CLI Integration via BRGit Module | Approved |
| [ADR-003](ADR-003-nsuserdefaults-persistence.md) | NSUserDefaults for State Persistence | Approved |
| [ADR-004](ADR-004-centralized-state-management.md) | Centralized State Management in App.tsx | Approved |
| [ADR-005](ADR-005-lazy-loading-branch-data.md) | Lazy Loading Strategy for Branch Data | Approved |
| [ADR-006](ADR-006-props-based-components.md) | Props-Based Presentational Components | Approved |
| [ADR-007](ADR-007-metro-xcode-build-pipeline.md) | Metro + Xcode Dual Build Pipeline | Approved |
| [ADR-008](ADR-008-local-only-review-comments.md) | Local-Only Inline Review Comments | Approved |

## ADR Categories

### Tier 1: Foundation (Critical - Affects ALL Code)
- **ADR-001**: Platform choice (macOS-only)
- **ADR-002**: Git integration approach (CLI-based)
- **ADR-003**: State persistence (NSUserDefaults)

### Tier 2: Application Architecture
- **ADR-004**: State management pattern (centralized)
- **ADR-005**: Performance strategy (lazy loading)
- **ADR-006**: Component architecture (props-based)

### Tier 3: Development Process
- **ADR-007**: Build pipeline (Metro + Xcode)
- **ADR-008**: Feature implementation (local review comments)

## ADR Template Format

Branch Reviewer uses a **Strict Enforcement Format** optimized for AI-driven code review:

```markdown
# ADR-[NUMBER]: [TITLE]

## Status
[Proposed | Approved | Deprecated | Superseded by ADR-XXX]

## Context
[2-3 sentences: Why this decision is needed, what problem it solves]

## Decision
[Clear statement of what is decided]

## Allowed
- [Specific permitted patterns/tools/approaches]
- [Explicit, enumerable items that comply with this decision]

## Prohibited
- [Specific forbidden patterns/tools/approaches]
- [These are BLOCKING violations - code cannot merge if it violates these]

## Consequences
- [Direct implications - both positive and negative outcomes]

## Enforcement
[How this ADR is verified - automated checks, code review requirements, etc.]
```

### Why This Format?

1. **Allowed/Prohibited Sections**: Make ADRs actionable for automated code review, not just documentation
2. **Enforcement Section**: Clear verification methods for compliance
3. **Concise Context**: Focus on decision rationale, not extensive documentation
4. **Status Tracking**: Lifecycle management (Proposed → Approved → Deprecated/Superseded)

## ADR Governance

### Creation Process

1. **Draft ADR**
   - Create new ADR file as `ADR-XXX-short-title.md`
   - Set Status to `Proposed`
   - Follow template format above

2. **Review**
   - Discuss with team (if applicable)
   - Validate Allowed/Prohibited sections are specific and actionable
   - Ensure Enforcement mechanisms are clear

3. **Approval**
   - Update Status to `Approved`
   - Commit with message: `ADR: Add ADR-XXX [title]`

### Compliance Enforcement

- **All code changes** must be reviewed against relevant ADRs
- **BLOCKING**: Code that violates ADR Prohibited sections cannot be merged
- **ADR Guardian**: Claude Code's ADR guardian agent enforces compliance during:
  - Planning phase (before code is written)
  - Pull request review (before code is merged)

### Evolution Process

1. **Deprecation**
   - Change Status to `Deprecated`
   - Add deprecation reason to Context
   - **Never delete ADRs** - they are historical records

2. **Superseding**
   - Create new ADR with improved approach
   - Update old ADR Status to `Superseded by ADR-XXX`
   - Link between old and new ADRs

3. **Amendment**
   - Minor clarifications can be made via edits
   - Major changes require a new superseding ADR
   - Track significant edits in commit messages

### Commit Hygiene

- **ADR changes always in separate commits**
- Never bundle ADR updates with code changes
- Commit message prefix: `ADR: Add/Update/Deprecate ADR-XXX`
- Examples:
  - `ADR: Add ADR-009 GraphQL API integration`
  - `ADR: Update ADR-003 to allow schema versioning`
  - `ADR: Deprecate ADR-005 in favor of ADR-012`

## Principles

Branch Reviewer's architectural decisions are guided by:

1. **Privacy First**: Local-only operations, no cloud dependencies
2. **Simplicity Over Features**: Minimal dependencies, clear patterns
3. **macOS Native**: Leverage platform capabilities without abstraction
4. **Developer Experience**: Fast iteration, predictable behavior
5. **Maintainability**: Explicit decisions, clear enforcement

## Resources

- [ADR Tools](https://github.com/npryce/adr-tools) - Command-line tools for managing ADRs
- [MADR](https://adr.github.io/madr/) - Markdown Any Decision Records format
- [ADR GitHub Organization](https://adr.github.io/) - Best practices and examples
