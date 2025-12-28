# Commit Plan: Fix Metro Resolver Circular Dependency

## Problem

Metro bundler crashes with "Maximum call stack size exceeded" error when starting. The error originates from `metro-resolver/src/resolve.js:37`, indicating infinite recursion.

## Root Cause

The custom `resolveRequest` function in `metro.config.js` (line 35-43) creates a circular dependency:

- Line 42 calls `metroResolver.resolve(context, moduleName, platform)` for fallback resolution
- `metroResolver.resolve()` checks for custom resolvers and calls our `resolveRequest` again
- This creates an infinite loop

## Solution

Replace the circular `metroResolver.resolve()` call with proper Metro resolver delegation using `context.resolveRequest()`:

- For `react-native`/`react-native-macos`: Return the sourceFile resolution (no change)
- For all other modules: Call `context.resolveRequest(context, moduleName, platform)`

Metro passes its internal `resolve` function via `context.resolveRequest` specifically to enable delegation without circular calls. This is the documented pattern for custom resolvers.

## Atomic Commit

**Single commit**: "Fix: Remove circular dependency in Metro custom resolver"

Changes:

1. Remove unused `metro-resolver` import from `metro.config.js`
2. Replace `metroResolver.resolve(...)` with `context.resolveRequest(...)` for proper delegation
3. Add comment explaining Metro's delegation pattern via context.resolveRequest

This is atomic because:

- Single file changed (`metro.config.js`)
- Single logical fix (resolver delegation)
- No dependencies on other changes
- Can be safely rolled back if issues arise

## Validation

- Metro starts successfully without stack overflow
- Debug builds continue to work with Metro dev server
- Module resolution works for both aliased and regular modules

## Related ADRs

- **ADR-007**: Metro + Xcode Dual Build Pipeline
  - Confirms Metro configuration changes require careful review
  - Requires validation that Debug builds still work
