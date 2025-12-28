# Justfile — branchReviewer macOS (React Native macOS)
# Requires: https://github.com/casey/just

# Use bash with safer defaults
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Default target: list available recipes
default:
    @just --list

# Install JavaScript dependencies
install:
    npm install

# Start Metro bundler
start:
    npm start

# Bundle JS for macOS (produces macos/main.jsbundle and assets)
bundle-macos:
    npm run bundle:macos

# (Re)install CocoaPods for macOS
pods:
    cd macos && pod install

# Run the macOS app (starts Metro separately)
macos:
    npm run macos

# Run tests
test:
    npm test

# Lint code
lint:
    npm run lint

# Type-check with TypeScript
typecheck:
    npx tsc --noEmit

# Format code with Prettier
fmt:
    npx prettier --write .

# Reset Metro cache (does not start Metro)
clean-metro-cache:
    rm -rf .metro-cache ${TMPDIR:-/tmp}/metro-* 2>/dev/null || true
    if command -v watchman >/dev/null; then watchman watch-del-all || true; fi

# Reseed Watchman for this project only (helps resolve recrawl warnings)
watchman-reseed:
    if command -v watchman >/dev/null; then watchman watch-del "$PWD" || true; watchman watch-project "$PWD"; else echo "Watchman not installed"; fi

# Full clean: remove node_modules and reinstall
clean:
    rm -rf node_modules
    npm install

# Build release .app via xcodebuild
build-app:
    xcodebuild -workspace macos/branchReviewer.xcworkspace \
      -scheme branchReviewer-macOS \
      -configuration Release \
      -arch arm64 \
      build

# Create an unsigned DMG from Release .app (if present)
package-dmg:
    APP_PATH="$(find ~/Library/Developer/Xcode/DerivedData -name branchReviewer.app -path "*Build/Products/Release/*" -print -quit)" && \
    [ -d "$APP_PATH" ] && hdiutil create -volname "Branch Reviewer" -srcfolder "$APP_PATH" -ov -format UDZO branchReviewer-unsigned.dmg && \
    echo "Created branchReviewer-unsigned.dmg" || echo "Release .app not found. Run: just build-app"

# Environment versions
versions:
    node -v
    npm -v
    npx react-native --version
    ruby -v || true
    if command -v pod >/dev/null; then pod --version; else echo "CocoaPods not found"; fi

# Help with common flows
help:
    @echo "Common flows:"
    @echo "  just dev               # Install deps + pods, then start Metro (in this terminal)"
    @echo "  just macos             # Launch macOS app (run in separate terminal while Metro runs)"
    @echo "  just up                # Alias for dev"
    @echo "  just run-all           # Alias for dev"
    @echo "  just start             # Start Metro"
    @echo "  just pods              # Install CocoaPods for macOS"
    @echo "  just macos             # Launch macOS app"
    @echo "  just build-app         # Build Release .app"
    @echo "  just package-dmg       # Create unsigned DMG from Release .app"
    @echo "  just bundle-macos      # Produce main.jsbundle for offline runs"
    @echo "  just test              # Run tests"
    @echo "  just lint              # Lint code"
    @echo "  just typecheck         # TypeScript check"
    @echo "  just fmt               # Format code"
    @echo "  just clean             # Reinstall deps"
    @echo "  just clean-metro-cache # Reset Metro cache"
    @echo "  just watchman-reseed   # Reset this project's Watchman watch"
    @echo "  just versions          # Show tool versions"

# Dev workflow: install deps, pods, and start Metro bundler
# After Metro starts, run "just macos" or "npm run macos" in another terminal
dev: install pods
    @echo "✓ Dependencies and CocoaPods installed"
    @echo "Starting Metro bundler..."
    @echo ""
    @echo "Once Metro is ready, run in another terminal:"
    @echo "  just macos"
    @echo "  (or: npm run macos)"
    @echo ""
    npm start

# Convenience aliases
up: dev
run-all: dev
